from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Card, User, Profile, AnalyticsEvent
from ..utils.auth import get_jwt_user, require_company_member, validate_request_json
from datetime import datetime
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from sqlalchemy import or_

bp = Blueprint('card', __name__, url_prefix='/api/card')


@bp.route('/<code>', methods=['GET'])
def get_card(code):
    """Get card information by code (public endpoint)"""
    card = Card.query.filter(or_(Card.code == code, Card.short_code == code)).first()
    
    if not card:
        return {'error': 'Card not found'}, 404
    
    # Track event
    event = AnalyticsEvent(
        card_id=card.id,
        company_id=card.company_id,
        event_type='view',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', ''),
        referrer=request.referrer
    )
    db.session.add(event)
    db.session.commit()
    
    # Claimed cards always resolve to the profile page.
    if card.assigned_user and card.assigned_user.profile:
        if card.claim_status:
            return {
                'card': card.to_dict(),
                'status': 'claimed',
                'redirect': f'/u/{card.assigned_user.profile.public_slug}',
                'display_mode': 'profile'
            }, 200

        # Assigned but not claimed: visitors should still see the business profile.
        return {
            'card': card.to_dict(),
            'status': 'assigned',
            'redirect': f'/u/{card.assigned_user.profile.public_slug}',
            'display_mode': 'profile'
        }, 200
    
    # Card is unclaimed, return activation info
    return {
        'card': card.to_dict(),
        'status': 'unclaimed',
        'can_claim': True,
        'display_mode': 'activation'
    }, 200


@bp.route('/claim', methods=['POST'])
@validate_request_json('code')
def claim_card():
    """Claim a card - assign it to current user"""
    user = get_jwt_user()
    if not user:
        return {'error': 'Authentication required'}, 401
    
    data = request.get_json()
    incoming_code = str(data['code']).strip()
    card = Card.query.filter(or_(Card.code == incoming_code, Card.short_code == incoming_code)).first()
    
    if not card:
        return {'error': 'Card not found'}, 404
    
    if card.claim_status:
        return {'error': 'Card already claimed'}, 400
    
    if card.assigned_user_id and card.assigned_user_id != user.id:
        return {'error': 'Card is assigned to another user'}, 403
    
    # Claim the card
    card.assigned_user_id = user.id
    card.claim_status = True
    card.claimed_at = datetime.utcnow()
    card.status = 'active'
    
    db.session.commit()
    
    return {
        'message': 'Card claimed successfully',
        'card': card.to_dict(),
        'profile_slug': user.profile.public_slug if user.profile else None
    }, 200


@bp.route('/<card_id>/assign', methods=['POST'])
@validate_request_json('user_id')
def assign_card(card_id):
    """Assign card to a user (company admin only)"""
    user = get_jwt_user()

    if not user:
        return {'error': 'Authentication required'}, 401

    if user.role not in ['company_admin', 'admin']:
        return {'error': 'Insufficient permissions'}, 403

    data = request.get_json()

    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404

    if user.role != 'admin' and card.company_id != user.company_id:
        return {'error': 'Card does not belong to your company'}, 403

    target_user = User.query.get(data['user_id'])
    if not target_user:
        return {'error': 'User not found'}, 404

    if target_user.company_id != card.company_id:
        return {'error': 'User is not in card company'}, 403

    if card.claim_status:
        return {'error': 'Claimed cards are permanently assigned and cannot be reassigned'}, 400

    # Assign card
    card.assigned_user_id = target_user.id
    card.status = 'assigned'
    card.assigned_at = datetime.utcnow()

    db.session.commit()

    return {
        'message': 'Card assigned successfully',
        'card': card.to_dict()
    }, 200


@bp.route('/<card_id>/reassign', methods=['POST'])
@validate_request_json('user_id')
def reassign_card(card_id):
    """Reassign card from one user to another"""
    user = get_jwt_user()

    if not user:
        return {'error': 'Authentication required'}, 401

    if user.role not in ['company_admin', 'admin']:
        return {'error': 'Insufficient permissions'}, 403

    data = request.get_json()

    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404

    if user.role != 'admin' and card.company_id != user.company_id:
        return {'error': 'Card does not belong to your company'}, 403

    target_user = User.query.get(data['user_id'])
    if not target_user:
        return {'error': 'User not found'}, 404

    if target_user.company_id != card.company_id:
        return {'error': 'User is not in card company'}, 403

    if card.claim_status:
        return {'error': 'Claimed cards are permanently assigned and cannot be reassigned'}, 400

    # Reassign
    card.assigned_user_id = target_user.id
    card.status = 'assigned'
    card.assigned_at = datetime.utcnow()

    db.session.commit()

    return {
        'message': 'Card reassigned successfully',
        'card': card.to_dict()
    }, 200


@bp.route('/<card_id>/status', methods=['PATCH'])
@validate_request_json('status')
def update_card_status(card_id):
    """Update card status (suspend, retire, etc)"""
    user = get_jwt_user()

    if not user:
        return {'error': 'Authentication required'}, 401

    if user.role not in ['company_admin', 'admin']:
        return {'error': 'Insufficient permissions'}, 403

    data = request.get_json()
    valid_statuses = ['active', 'suspended', 'retired', 'unassigned']

    if data['status'] not in valid_statuses:
        return {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, 400

    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404

    if user.role != 'admin' and card.company_id != user.company_id:
        return {'error': 'Card does not belong to your company'}, 403

    if card.claim_status and data['status'] in ['unassigned', 'retired']:
        return {'error': 'Claimed cards are permanently assigned and cannot be unassigned or retired'}, 400

    card.status = data['status']

    if data['status'] in ['unassigned', 'retired']:
        card.assigned_user_id = None
        card.assigned_at = None
        card.claim_status = False
        card.claimed_at = None

    db.session.commit()

    return {
        'message': f'Card status updated to {data["status"]}',
        'card': card.to_dict()
    }, 200
