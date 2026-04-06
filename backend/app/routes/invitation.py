from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Invitation, Company, Card, User, AuditLog
from ..utils.auth import get_jwt_user, validate_request_json
from datetime import datetime, timedelta
import secrets

bp = Blueprint('invitation', __name__, url_prefix='/api/company/<company_id>/invitations')


@bp.route('/send', methods=['POST'])
@validate_request_json('email')
def send_invitation(company_id):
    """Send invitation to employee"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    data = request.get_json()
    email = data['email']
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return {'error': 'User already registered'}, 400
    
    # Check if invitation already exists
    existing = Invitation.query.filter_by(email=email, company_id=company_id, status='pending').first()
    if existing:
        return {'error': 'Pending invitation already exists for this email'}, 400
    
    # Create invitation
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    invitation = Invitation(
        company_id=company_id,
        email=email,
        role=data.get('role', 'employee'),
        assigned_card_id=data.get('card_id'),
        expires_at=expires_at,
        invited_by_user_id=user.id,
        token=secrets.token_urlsafe(32)
    )
    
    db.session.add(invitation)
    
    # If card is assigned, update it
    if data.get('card_id'):
        card = Card.query.get(data['card_id'])
        if card and card.company_id == company_id:
            card.status = 'assigned'  # Mark as assigned (user pending)
    
    # Create audit log
    audit = AuditLog(
        actor_user_id=user.id,
        action='send_invitation',
        target_type='invitation',
        target_id=invitation.id,
        changes={'email': email, 'role': data.get('role', 'employee')},
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    
    db.session.commit()
    
    # Build invitation link
    invitation_link = f"/invitation/{invitation.token}/accept"
    
    return {
        'message': 'Invitation sent successfully',
        'invitation': invitation.to_dict(),
        'invitation_link': invitation_link
    }, 201


@bp.route('', methods=['GET'])
def list_invitations(company_id):
    """List all invitations for company"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')  # pending, accepted, expired
    
    query = Invitation.query.filter_by(company_id=company_id)
    
    if status:
        query = query.filter_by(status=status)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    invitations = []
    for inv in pagination.items:
        inv_data = inv.to_dict()
        inv_data['is_expired'] = inv.is_expired()
        invitations.append(inv_data)
    
    return {
        'invitations': invitations,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/<invitation_id>/resend', methods=['POST'])
def resend_invitation(company_id, invitation_id):
    """Resend invitation"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    invitation = Invitation.query.get(invitation_id)
    
    if not invitation or invitation.company_id != company_id:
        return {'error': 'Invitation not found'}, 404
    
    # Reset expiration
    invitation.expires_at = datetime.utcnow() + timedelta(days=7)
    db.session.commit()
    
    return {
        'message': 'Invitation resent',
        'invitation': invitation.to_dict()
    }, 200


@bp.route('/<invitation_id>/revoke', methods=['POST'])
def revoke_invitation(company_id, invitation_id):
    """Revoke invitation"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    invitation = Invitation.query.get(invitation_id)
    
    if not invitation or invitation.company_id != company_id:
        return {'error': 'Invitation not found'}, 404
    
    invitation.status = 'revoked'
    
    # Unassign card if assigned
    if invitation.assigned_card_id:
        card = Card.query.get(invitation.assigned_card_id)
        if card:
            card.status = 'unassigned'
            card.assigned_user_id = None
    
    db.session.commit()
    
    return {'message': 'Invitation revoked'}, 200
