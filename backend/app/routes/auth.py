from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import User, Profile, Company, Invitation, Card
from ..utils.auth import create_tokens, get_jwt_user, require_role, validate_request_json
from datetime import datetime
import secrets

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


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
        db.session.add(profile)
    else:
        # User already exists, add to company if not already
        if not user.company_id:
            user.company_id = invitation.company_id
            user.role = invitation.role
    
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
