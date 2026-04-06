from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Profile, User, AnalyticsEvent, CompanyPolicy
from ..utils.auth import get_jwt_user, validate_request_json
from datetime import datetime

bp = Blueprint('profile', __name__, url_prefix='/api/profile')


@bp.route('/<slug>', methods=['GET'])
def get_public_profile(slug):
    """Get public profile by slug"""
    profile = Profile.query.filter_by(public_slug=slug).first()
    
    if not profile:
        return {'error': 'Profile not found'}, 404
    
    # Track view event when a related card exists
    if profile.user and profile.user.cards:
        event = AnalyticsEvent(
            profile_id=profile.id,
            user_id=profile.user_id,
            card_id=profile.user.cards[0].id,
            event_type='profile_view',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            referrer=request.referrer
        )
        db.session.add(event)
        db.session.commit()
    
    return {
        'profile': profile.to_dict(include_sensitive=False),
        'user': {
            'id': profile.user.id,
            'first_name': profile.user.first_name,
            'last_name': profile.user.last_name,
            'role': profile.user.role
        } if profile.user else None
    }, 200


@bp.route('/me', methods=['GET'])
def get_my_profile():
    """Get current user's profile"""
    user = get_jwt_user()
    if not user:
        return {'error': 'Authentication required'}, 401
    
    if not user.profile:
        return {'error': 'Profile not found'}, 404
    
    return {
        'profile': user.profile.to_dict(include_sensitive=True)
    }, 200


@bp.route('/me/update', methods=['PUT'])
@validate_request_json('public_slug')
def update_my_profile():
    """Update current user's profile"""
    user = get_jwt_user()
    if not user:
        return {'error': 'Authentication required'}, 401
    
    if not user.profile:
        return {'error': 'Profile not found'}, 404
    
    data = request.get_json()
    profile = user.profile
    
    # Check company policy if user is part of company
    if user.company_id:
        policy = CompanyPolicy.query.filter_by(company_id=user.company_id).first()
        if policy:
            editable = policy.editable_fields or []
            # Only update fields that company allows
            allowed_fields = set(editable)
        else:
            allowed_fields = {
                'public_slug', 'title', 'bio', 'phone', 'whatsapp',
                'email_public', 'website', 'location', 'photo_url',
                'linkedin_url', 'twitter_url', 'instagram_url', 'cover_color',
                'button_style', 'font_style', 'background_image_url',
                'background_overlay_opacity', 'background_blur_strength', 'section_order',
                'layout_mode', 'section_positions',
                'social_links_json', 'contact_action_order', 'enabled_contact_actions',
                'name_size', 'title_size', 'bio_size', 'photo_size', 'photo_offset_y',
                'name_bold', 'title_bold', 'bio_bold', 'body_background_color',
                'body_text_color', 'body_background_image_url', 'action_hover_color',
                'show_exchange_contact'
            }
    else:
        allowed_fields = {
            'public_slug', 'title', 'bio', 'phone', 'whatsapp',
            'email_public', 'website', 'location', 'photo_url',
            'linkedin_url', 'twitter_url', 'instagram_url', 'cover_color',
            'button_style', 'font_style', 'background_image_url',
            'background_overlay_opacity', 'background_blur_strength', 'section_order',
            'layout_mode', 'section_positions',
            'social_links_json', 'contact_action_order', 'enabled_contact_actions',
            'name_size', 'title_size', 'bio_size', 'photo_size', 'photo_offset_y',
            'name_bold', 'title_bold', 'bio_bold', 'body_background_color',
            'body_text_color', 'body_background_image_url', 'action_hover_color',
            'show_exchange_contact'
        }
    
    # Check for slug uniqueness
    if 'public_slug' in data and data['public_slug'] != profile.public_slug:
        existing = Profile.query.filter_by(public_slug=data['public_slug']).first()
        if existing:
            return {'error': 'Public slug already taken'}, 400
        profile.public_slug = data['public_slug']
    
    # Update allowed fields
    for field in allowed_fields:
        if field in data:
            setattr(profile, field, data[field])
    
    # Calculate completion status
    required_fields = []
    if user.company_id:
        policy = CompanyPolicy.query.filter_by(company_id=user.company_id).first()
        if policy:
            required_fields = policy.required_fields or []
    
    completed = sum(1 for field in required_fields if getattr(profile, field, None))
    profile.completion_status = int((completed / len(required_fields) * 100)) if required_fields else 100
    
    # Check if approval is needed
    if user.company_id:
        policy = CompanyPolicy.query.filter_by(company_id=user.company_id).first()
        if policy and policy.approval_required:
            profile.approval_status = 'pending_approval'
        elif policy and policy.auto_approve:
            profile.approval_status = 'approved'
    else:
        profile.approval_status = 'approved'
    
    profile.updated_at = datetime.utcnow()
    db.session.commit()
    
    return {
        'message': 'Profile updated successfully',
        'profile': profile.to_dict(include_sensitive=True)
    }, 200


@bp.route('/<profile_id>/approve', methods=['POST'])
def approve_profile(profile_id):
    """Approve a profile (company admin only)"""
    user = get_jwt_user()
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Insufficient permissions'}, 403
    
    profile = Profile.query.get(profile_id)
    if not profile:
        return {'error': 'Profile not found'}, 404
    
    if profile.user.company_id != user.company_id:
        return {'error': 'Profile does not belong to your company'}, 403
    
    profile.approval_status = 'approved'
    db.session.commit()
    
    return {
        'message': 'Profile approved',
        'profile': profile.to_dict(include_sensitive=True)
    }, 200


@bp.route('/<profile_id>/reject', methods=['POST'])
@validate_request_json('reason')
def reject_profile(profile_id):
    """Reject a profile (company admin only)"""
    user = get_jwt_user()
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Insufficient permissions'}, 403
    
    data = request.get_json()
    profile = Profile.query.get(profile_id)
    if not profile:
        return {'error': 'Profile not found'}, 404
    
    if profile.user.company_id != user.company_id:
        return {'error': 'Profile does not belong to your company'}, 403
    
    profile.approval_status = 'rejected'
    db.session.commit()
    
    return {
        'message': 'Profile rejected',
        'reason': data['reason']
    }, 200
