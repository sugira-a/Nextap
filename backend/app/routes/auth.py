from flask import Blueprint, request, jsonify, current_app
from ..extensions import db
from ..models import User, Profile, Company, Invitation, Card, CompanyPolicy
from ..utils.auth import create_tokens, get_jwt_user, require_role, validate_request_json
from datetime import datetime
from ..utils.email import send_reset_email
import secrets
import os

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _apply_company_template(profile, company_id):
    if not company_id:
        return

    policy = CompanyPolicy.query.filter_by(company_id=company_id).first()
    template = policy.profile_template if policy and policy.profile_template else {}
    if not template:
        return

    editable = set(policy.editable_fields or [])
    for field, value in template.items():
        if field in editable:
            continue
        if hasattr(profile, field):
            setattr(profile, field, value)


@bp.route('/register', methods=['POST'])
@validate_request_json('email', 'password', 'first_name', 'last_name')
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return {'error': 'Email already registered'}, 400
    
    # Create user
    user = User(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role='employee'
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create profile with public slug
    profile = Profile(
        user_id=user.id,
        public_slug=data.get('public_slug') or f"{user.first_name.lower()}{user.last_name.lower()}{user.id[:4]}"
    )
    db.session.add(profile)
    db.session.commit()
    
    # Create tokens
    access_token, refresh_token = create_tokens(user.id)
    
    return {
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 201


@bp.route('/login', methods=['POST'])
@validate_request_json('email', 'password')
def login():
    """Login user"""
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return {'error': 'Invalid email or password'}, 401
    
    if user.status != 'active':
        return {'error': 'Account is not active'}, 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create tokens
    access_token, refresh_token = create_tokens(user.id)
    
    return {
        'message': 'Logged in successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 200


@bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user"""
    user = get_jwt_user()
    
    if not user:
        return {'error': 'Not authenticated'}, 401
    
    return {
        'user': user.to_dict(),
        'profile': user.profile.to_dict(include_sensitive=True) if user.profile else None,
        'company': user.company.to_dict() if user.company else None,
        'card': user.cards[0].to_dict() if user.cards else None
    }, 200


@bp.route('/logout', methods=['POST'])
def logout():
    """Logout user (client-side token invalidation)"""
    # Token invalidation is handled client-side
    return {'message': 'Logged out successfully'}, 200


@bp.route('/change-password', methods=['POST'])
def change_password():
    """Change password for the authenticated user"""
    user = get_jwt_user()
    if not user:
        return {'error': 'Not authenticated'}, 401

    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return {'error': 'Current and new password are required'}, 400

    if not user.check_password(current_password):
        return {'error': 'Current password is incorrect'}, 400

    if len(new_password) < 8:
        return {'error': 'New password must be at least 8 characters'}, 400

    user.set_password(new_password)
    db.session.commit()

    return {'message': 'Password changed successfully'}, 200


@bp.route('/forgot-password', methods=['POST'])
@validate_request_json('email')
def forgot_password():
    """Request a password reset token"""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return {'error': 'Email is required'}, 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Return generic message for security (don't reveal if email exists)
        return {'message': 'If an account exists with that email, a reset link has been sent'}, 200
    
    # Generate reset token (32 bytes = 64 hex chars)
    reset_token = secrets.token_hex(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + __import__('datetime').timedelta(hours=24)
    db.session.commit()

    # Build frontend reset link and attempt to send email
    frontend_url = current_app.config.get('FRONTEND_URL') or 'http://localhost:5173'
    reset_link = f"{frontend_url.rstrip('/')}/reset-password?token={reset_token}"
    
    try:
        sent = send_reset_email(email, reset_link)
        if not sent:
            current_app.logger.warning("⚠ SMTP not configured or email failed for %s", email)
            # Still return 200 for security, but log the issue
    except Exception as e:
        current_app.logger.error("❌ Exception sending reset email to %s: %s", email, str(e))

    return {
        'message': 'If an account exists with that email, a reset link has been sent',
    }, 200


@bp.route('/reset-password', methods=['POST'])
@validate_request_json('token', 'new_password')
def reset_password():
    """Reset password with a valid reset token"""
    data = request.get_json()
    reset_token = data.get('token', '').strip()
    new_password = data.get('new_password', '')
    
    if not reset_token or not new_password:
        return {'error': 'Token and new password are required'}, 400
    
    if len(new_password) < 8:
        return {'error': 'Password must be at least 8 characters'}, 400
    
    user = User.query.filter_by(reset_token=reset_token).first()
    
    if not user:
        return {'error': 'Invalid or expired reset token'}, 400
    
    if user.reset_token_expires < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        return {'error': 'Reset token has expired'}, 400
    
    # Reset password and clear token
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    return {'message': 'Password reset successfully'}, 200


@bp.route('/me', methods=['DELETE'])
def delete_current_user():
    """Delete the current authenticated user account."""
    user = get_jwt_user()

    if not user:
        return {'error': 'Not authenticated'}, 401

    for card in list(user.cards):
        card.assigned_user_id = None
        card.status = 'unassigned'
        card.claim_status = False

    if user.profile:
        db.session.delete(user.profile)

    db.session.delete(user)
    db.session.commit()

    return {'message': 'Account deleted successfully'}, 200


@bp.route('/invitation/<token>/accept', methods=['POST'])
@validate_request_json('password')
def accept_invitation(token):
    """Accept an invitation and create account if needed"""
    data = request.get_json()
    
    invitation = Invitation.query.filter_by(token=token).first()
    
    if not invitation:
        return {'error': 'Invitation not found'}, 404
    
    if invitation.status != 'pending':
        return {'error': 'Invitation is not pending'}, 400
    
    if invitation.is_expired():
        return {'error': 'Invitation has expired'}, 400
    
    # Check if user already exists
    user = User.query.filter_by(email=invitation.email).first()
    
    if not user:
        # Create new user
        parts = invitation.email.split('@')[0].split('.')
        first_name = parts[0].capitalize() if parts else 'User'
        last_name = parts[1].capitalize() if len(parts) > 1 else ''
        
        user = User(
            email=invitation.email,
            first_name=first_name,
            last_name=last_name,
            role=invitation.role,
            company_id=invitation.company_id
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()
        
        # Create profile
        profile = Profile(
            user_id=user.id,
            public_slug=f"{first_name.lower()}{last_name.lower()}{user.id[:4]}"
        )
        _apply_company_template(profile, invitation.company_id)
        db.session.add(profile)
    else:
        # User already exists, add to company if not already
        if not user.company_id:
            user.company_id = invitation.company_id
            user.role = invitation.role

        if not user.profile:
            parts = user.email.split('@')[0].split('.')
            first_name = parts[0].capitalize() if parts else 'User'
            last_name = parts[1].capitalize() if len(parts) > 1 else ''
            profile = Profile(
                user_id=user.id,
                public_slug=f"{first_name.lower()}{last_name.lower()}{user.id[:4]}"
            )
            _apply_company_template(profile, invitation.company_id)
            db.session.add(profile)
        else:
            _apply_company_template(user.profile, invitation.company_id)
    
    # Assign card if invitation has one
    if invitation.assigned_card_id:
        card = Card.query.get(invitation.assigned_card_id)
        if card:
            card.assigned_user_id = user.id
            card.status = 'assigned'
            card.assigned_at = datetime.utcnow()
    
    # Mark invitation as accepted
    invitation.status = 'accepted'
    invitation.accepted_at = datetime.utcnow()
    
    db.session.commit()
    
    # Create tokens
    access_token, refresh_token = create_tokens(user.id)
    
    return {
        'message': 'Invitation accepted',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, 200


@bp.route('/test-email', methods=['POST'])
def test_email():
    """Test SMTP configuration - sends a test email to provided address"""
    data = request.get_json() or {}
    test_email_addr = data.get('email', '').lower().strip()
    
    if not test_email_addr:
        return {'error': 'Email address required'}, 400
    
    current_app.logger.info("🧪 Testing SMTP configuration...")
    
    result = send_reset_email(test_email_addr, 'http://example.com/test-link')
    
    if result:
        return {
            'success': True,
            'message': f'✓ Test email sent to {test_email_addr}',
            'smtp_config': {
                'host': os.getenv('SMTP_HOST') or 'Not configured',
                'port': os.getenv('SMTP_PORT') or '587',
                'user': os.getenv('SMTP_USER') or os.getenv('MAIL_USERNAME') or 'Not configured'
            }
        }, 200
    else:
        return {
            'success': False,
            'message': '❌ Failed to send test email. Check server logs for details.',
            'smtp_config': {
                'host': os.getenv('SMTP_HOST') or 'Not configured',
                'port': os.getenv('SMTP_PORT') or '587',
                'user': os.getenv('SMTP_USER') or os.getenv('MAIL_USERNAME') or 'Not configured'
            }
        }, 400
