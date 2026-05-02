from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Company, User, Card, AuditLog, Profile, AnalyticsEvent, CompanyPolicy
from ..utils.auth import get_jwt_user, require_role
from datetime import datetime, timedelta
import secrets
import string

bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def _new_card_short_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
    while Card.query.filter_by(short_code=candidate).first():
        candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
    return candidate


@bp.route('/companies', methods=['GET'])
@require_role('admin')
def list_companies():
    """List all companies (admin only)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    plan = request.args.get('plan')
    
    query = Company.query
    
    if status:
        query = query.filter_by(status=status)
    
    if plan:
        query = query.filter_by(plan=plan)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    companies = []
    for company in pagination.items:
        company_data = company.to_dict()
        company_data['stats'] = {
            'employee_count': len(company.users),
            'card_count': len(company.cards),
            'invitation_count': len(company.invitations)
        }
        companies.append(company_data)
    
    return {
        'companies': companies,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/companies/<company_id>', methods=['GET'])
@require_role('admin')
def get_company_details(company_id):
    """Get full company details for admin view page."""
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    members = []
    for member in company.users:
        members.append({
            'id': member.id,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'role': member.role,
            'status': member.status,
            'profile': member.profile.to_dict(include_sensitive=True) if member.profile else None,
        })

    cards = [card.to_dict() for card in sorted(company.cards, key=lambda c: c.created_at or datetime.min, reverse=True)[:20]]

    return {
        'company': company.to_dict(),
        'stats': {
            'employee_count': len(company.users),
            'card_count': len(company.cards),
            'invitation_count': len(company.invitations),
            'claimed_cards': len([card for card in company.cards if card.claim_status]),
            'active_cards': len([card for card in company.cards if card.status == 'active']),
        },
        'members': members,
        'cards': cards,
    }, 200


@bp.route('/users', methods=['GET'])
@require_role('admin')
def list_all_users():
    """List all users (admin only)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    status = request.args.get('status')
    company_id = request.args.get('company_id')
    
    query = User.query
    
    if role:
        query = query.filter_by(role=role)
    
    if status:
        query = query.filter_by(status=status)
    
    if company_id:
        query = query.filter_by(company_id=company_id)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    users = []
    for user in pagination.items:
        user_data = user.to_dict()
        user_data['company'] = {
            'id': user.company.id,
            'name': user.company.name,
            'slug': user.company.slug,
        } if user.company else None
        users.append(user_data)

    return {
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/users/<user_id>', methods=['GET'])
@require_role('admin')
def get_user_details(user_id):
    """Get full user and profile details for admin view page."""
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404

    return {
        'user': user.to_dict(),
        'profile': user.profile.to_dict(include_sensitive=True) if user.profile else None,
        'company': {
            'id': user.company.id,
            'name': user.company.name,
            'slug': user.company.slug,
        } if user.company else None,
        'card': user.cards[0].to_dict() if user.cards else None,
    }, 200


@bp.route('/users/<user_id>', methods=['PATCH'])
@require_role('admin')
def update_user_details(user_id):
    """Update user account and profile details from admin view page."""
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404

    data = request.get_json() or {}

    if 'first_name' in data and str(data['first_name']).strip():
        user.first_name = str(data['first_name']).strip()

    if 'last_name' in data and str(data['last_name']).strip():
        user.last_name = str(data['last_name']).strip()

    if 'status' in data:
        if data['status'] not in ['active', 'inactive', 'suspended']:
            return {'error': 'Invalid status'}, 400
        user.status = data['status']

    profile = user.profile
    if not profile:
        base_slug = f"{user.first_name}{user.last_name}".lower().replace(' ', '') or 'user'
        slug_candidate = base_slug
        counter = 1
        while Profile.query.filter_by(public_slug=slug_candidate).first():
            counter += 1
            slug_candidate = f"{base_slug}{counter}"
        profile = Profile(user_id=user.id, public_slug=slug_candidate)
        db.session.add(profile)

    if 'public_slug' in data:
        new_slug = str(data['public_slug']).strip()
        if not new_slug:
            return {'error': 'public_slug cannot be empty'}, 400
        existing_slug = Profile.query.filter_by(public_slug=new_slug).first()
        if existing_slug and existing_slug.user_id != user.id:
            return {'error': 'Public slug already taken'}, 400
        profile.public_slug = new_slug

    profile_fields = {
        'title', 'bio', 'phone', 'whatsapp', 'email_public', 'website', 'location',
        'photo_url', 'linkedin_url', 'twitter_url', 'instagram_url', 'cover_color',
        'button_style', 'font_style', 'background_image_url',
        'background_overlay_opacity', 'background_blur_strength', 'section_order',
        'layout_mode', 'section_positions',
        'social_links_json', 'contact_action_order', 'enabled_contact_actions',
        'name_size', 'title_size', 'bio_size', 'photo_size', 'photo_offset_y',
        'name_bold', 'title_bold', 'bio_bold', 'body_background_color',
        'body_text_color', 'body_background_image_url', 'action_hover_color',
        'show_exchange_contact'
    }
    for field in profile_fields:
        if field in data:
            setattr(profile, field, data[field])

    profile.updated_at = datetime.utcnow()
    db.session.commit()

    return {
        'message': 'User details updated successfully',
        'user': user.to_dict(),
        'profile': profile.to_dict(include_sensitive=True),
    }, 200


@bp.route('/cards', methods=['GET', 'POST'])
@require_role('admin')
def list_all_cards():
    """List all cards or generate cards (admin only)."""
    if request.method == 'POST':
        data = request.get_json() or {}
        scope = str(data.get('scope') or 'company').strip().lower()
        company_id = data.get('company_id') or None

        if scope not in ['company', 'personal']:
            return {'error': 'Invalid scope'}, 400

        if scope == 'company':
            if not company_id:
                return {'error': 'company_id is required for company cards'}, 400

            company = Company.query.get(company_id)
            if not company:
                return {'error': 'Company not found'}, 404
        else:
            company = None
            company_id = None

        try:
            count = max(1, min(int(data.get('count', 5)), 100))
        except (TypeError, ValueError):
            return {'error': 'Invalid count'}, 400

        created_cards = []
        for _ in range(count):
            code = f"NTW{secrets.token_hex(4).upper()}"
            while Card.query.filter_by(code=code).first():
                code = f"NTW{secrets.token_hex(4).upper()}"

            card = Card(
                company_id=company_id,
                code=code,
                short_code=_new_card_short_code(),
                status='personal' if scope == 'personal' else 'unassigned',
            )
            db.session.add(card)
            created_cards.append(card)

        db.session.commit()

        return {
            'message': 'Cards generated successfully',
            'cards': [card.to_dict() for card in created_cards],
        }, 201

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    company_id = request.args.get('company_id')
    claim_status = request.args.get('claim_status')
    assignment = request.args.get('assignment')
    scope = request.args.get('scope')
    search = (request.args.get('search') or '').strip()
    
    query = Card.query.outerjoin(User, User.id == Card.assigned_user_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if company_id:
        query = query.filter(Card.company_id == company_id)

    if scope == 'personal':
        query = query.filter(Card.company_id.is_(None))
    elif scope == 'company':
        query = query.filter(Card.company_id.isnot(None))

    if claim_status in ['true', 'false']:
        query = query.filter(Card.claim_status == (claim_status == 'true'))

    if assignment == 'assigned':
        query = query.filter(Card.assigned_user_id.isnot(None))
    elif assignment == 'unassigned':
        query = query.filter(Card.assigned_user_id.is_(None))

    if search:
        search_like = f'%{search}%'
        query = query.filter(
            db.or_(
                Card.code.ilike(search_like),
                Card.short_code.ilike(search_like),
                User.email.ilike(search_like),
                User.first_name.ilike(search_like),
                User.last_name.ilike(search_like),
            )
        )
    
    pagination = query.order_by(Card.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    cards = []
    for card in pagination.items:
        card_data = card.to_dict()
        card_data['assigned_user'] = {
            'id': card.assigned_user.id,
            'first_name': card.assigned_user.first_name,
            'last_name': card.assigned_user.last_name,
            'email': card.assigned_user.email,
        } if card.assigned_user else None
        card_data['company'] = {
            'id': card.company.id,
            'name': card.company.name,
            'slug': card.company.slug,
        } if card.company else None
        card_data['scope'] = 'company' if card.company_id else 'personal'
        card_data['tracking'] = {
            'total_views': len(card.analytics_events),
            'last_view_at': card.analytics_events[-1].timestamp.isoformat() if card.analytics_events else None,
        }
        cards.append(card_data)
    
    return {
        'cards': cards,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'cards_api_version': 'cards-v2',
    }, 200


@bp.route('/cards/<card_id>', methods=['GET'])
@require_role('admin')
def get_card_details(card_id):
    """Get detailed card identity, ownership, and tracking data."""
    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404

    events = sorted(card.analytics_events, key=lambda event: event.timestamp or datetime.min, reverse=True)
    recent_events = events[:25]

    last_7_days = datetime.utcnow() - timedelta(days=7)
    last_30_days = datetime.utcnow() - timedelta(days=30)

    unique_ips = {event.ip_address for event in events if event.ip_address}

    return {
        'card': card.to_dict(),
        'company': {
            'id': card.company.id,
            'name': card.company.name,
            'slug': card.company.slug,
        } if card.company else None,
        'assigned_user': {
            'id': card.assigned_user.id,
            'first_name': card.assigned_user.first_name,
            'last_name': card.assigned_user.last_name,
            'email': card.assigned_user.email,
            'status': card.assigned_user.status,
            'role': card.assigned_user.role,
            'profile_slug': card.assigned_user.profile.public_slug if card.assigned_user and card.assigned_user.profile else None,
        } if card.assigned_user else None,
        'tracking': {
            'total_views': len(events),
            'views_last_7_days': len([event for event in events if event.timestamp and event.timestamp >= last_7_days]),
            'views_last_30_days': len([event for event in events if event.timestamp and event.timestamp >= last_30_days]),
            'unique_visitors': len(unique_ips),
            'last_view_at': events[0].timestamp.isoformat() if events else None,
        },
        'recent_events': [
            {
                'id': event.id,
                'event_type': event.event_type,
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'device_type': event.device_type,
                'browser': event.browser,
                'os': event.os,
                'ip_address': event.ip_address,
                'referrer': event.referrer,
            }
            for event in recent_events
        ],
    }, 200


@bp.route('/audit-logs', methods=['GET'])
@require_role('admin')
def get_audit_logs():
    """Get audit logs"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    action = request.args.get('action')
    target_type = request.args.get('target_type')
    
    query = AuditLog.query
    
    if action:
        query = query.filter_by(action=action)
    
    if target_type:
        query = query.filter_by(target_type=target_type)
    
    pagination = query.order_by(AuditLog.timestamp.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    logs = []
    for log in pagination.items:
        log_data = log.to_dict()
        if log.actor:
            log_data['actor'] = {
                'id': log.actor.id,
                'email': log.actor.email,
                'first_name': log.actor.first_name,
                'last_name': log.actor.last_name
            }
        logs.append(log_data)
    
    return {
        'audit_logs': logs,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/stats', methods=['GET'])
@require_role('admin')
def get_system_stats():
    """Get system-wide statistics"""
    return {
        'stats': {
            'total_companies': Company.query.count(),
            'active_companies': Company.query.filter_by(status='active').count(),
            'total_users': User.query.count(),
            'total_cards': Card.query.count(),
            'claimed_cards': Card.query.filter_by(claim_status=True).count(),
            'active_cards': Card.query.filter_by(status='active').count(),
            'by_role': {
                'admin': User.query.filter_by(role='admin').count(),
                'company_admin': User.query.filter_by(role='company_admin').count(),
                'employee': User.query.filter_by(role='employee').count()
            }
        }
    }, 200


@bp.route('/analytics/overview', methods=['GET'])
@require_role('admin')
def get_analytics_overview():
    """Get platform-wide analytics overview for admin dashboards."""
    days = request.args.get('days', 30, type=int)
    days = max(1, min(days, 365))

    company_id = request.args.get('company_id') or None
    role = request.args.get('role') or None
    if role and role not in ['admin', 'company_admin', 'employee']:
        return {'error': 'Invalid role filter'}, 400

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if start_date_str and end_date_str:
        try:
            start_date = datetime.fromisoformat(f"{start_date_str}T00:00:00")
            end_date = datetime.fromisoformat(f"{end_date_str}T23:59:59.999999")
        except ValueError:
            return {'error': 'Invalid date format. Use YYYY-MM-DD.'}, 400
        if end_date < start_date:
            return {'error': 'end_date must be on or after start_date'}, 400
        days = max(1, (end_date.date() - start_date.date()).days + 1)
    else:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

    company_scope = Company.query
    if company_id:
        selected_company = Company.query.get(company_id)
        if not selected_company:
            return {'error': 'Company not found'}, 404
        company_scope = company_scope.filter(Company.id == company_id)

    user_scope = User.query
    card_scope = Card.query

    if company_id:
        user_scope = user_scope.filter(User.company_id == company_id)
        card_scope = card_scope.filter(Card.company_id == company_id)

    if role:
        user_scope = user_scope.filter(User.role == role)

    total_companies = company_scope.count()
    total_users = user_scope.count()
    total_cards = card_scope.count()

    new_companies_query = company_scope.filter(Company.created_at >= start_date, Company.created_at <= end_date)
    new_users_query = user_scope.filter(User.created_at >= start_date, User.created_at <= end_date)
    new_cards_query = card_scope.filter(Card.created_at >= start_date, Card.created_at <= end_date)

    new_companies = new_companies_query.count()
    new_users = new_users_query.count()
    new_cards = new_cards_query.count()

    events_query = AnalyticsEvent.query.filter(AnalyticsEvent.timestamp >= start_date, AnalyticsEvent.timestamp <= end_date)
    if company_id:
        events_query = events_query.filter(AnalyticsEvent.company_id == company_id)
    if role:
        events_query = events_query.join(User, User.id == AnalyticsEvent.user_id).filter(User.role == role)

    events = events_query.all()
    total_events = len(events)

    events_by_day = {}
    for offset in range(days):
        day = (start_date + timedelta(days=offset)).date().isoformat()
        events_by_day[day] = 0

    for event in events:
        day = event.timestamp.date().isoformat()
        if day not in events_by_day:
            events_by_day[day] = 0
        events_by_day[day] += 1

    company_event_counts = {}
    user_event_counts = {}
    for event in events:
        if event.company_id:
            company_event_counts[event.company_id] = company_event_counts.get(event.company_id, 0) + 1
        if event.user_id:
            user_event_counts[event.user_id] = user_event_counts.get(event.user_id, 0) + 1

    top_companies = []
    for company_id, event_count in sorted(company_event_counts.items(), key=lambda item: item[1], reverse=True)[:8]:
        company = Company.query.get(company_id)
        if not company:
            continue
        top_companies.append({
            'company_id': company.id,
            'name': company.name,
            'slug': company.slug,
            'events': event_count,
            'users': len(company.users),
            'cards': len(company.cards),
        })

    top_users = []
    for user_id, event_count in sorted(user_event_counts.items(), key=lambda item: item[1], reverse=True)[:8]:
        user = User.query.get(user_id)
        if not user:
            continue
        top_users.append({
            'user_id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip(),
            'email': user.email,
            'role': user.role,
            'events': event_count,
            'company': user.company.name if user.company else None,
        })

    company_options = [
        {
            'id': company.id,
            'name': company.name,
            'slug': company.slug,
            'status': company.status,
        }
        for company in Company.query.order_by(Company.name.asc()).all()
    ]

    status_breakdown = {
        'active': user_scope.filter_by(status='active').count(),
        'inactive': user_scope.filter_by(status='inactive').count(),
        'suspended': user_scope.filter_by(status='suspended').count(),
    }

    return {
        'overview': {
            'period_days': days,
            'totals': {
                'companies': total_companies,
                'users': total_users,
                'cards': total_cards,
                'events': total_events,
            },
            'new_in_period': {
                'companies': new_companies,
                'users': new_users,
                'cards': new_cards,
            },
            'filters': {
                'company_id': company_id,
                'role': role,
                'start_date': start_date.date().isoformat(),
                'end_date': end_date.date().isoformat(),
            },
            'status_breakdown': status_breakdown,
            'events_by_day': events_by_day,
            'top_companies': top_companies,
            'top_users': top_users,
            'company_options': company_options,
        }
    }, 200


@bp.route('/users/<user_id>/status', methods=['PATCH'])
@require_role('admin')
def update_user_status(user_id):
    """Update user status (admin only)."""
    data = request.get_json() or {}
    new_status = data.get('status')

    if new_status not in ['active', 'inactive', 'suspended']:
        return {'error': 'Invalid status'}, 400

    target_user = User.query.get(user_id)
    if not target_user:
        return {'error': 'User not found'}, 404

    target_user.status = new_status
    db.session.commit()

    return {
        'message': 'User status updated',
        'user': target_user.to_dict(),
    }, 200


@bp.route('/users/<user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user(user_id):
    """Delete a user account (admin only)."""
    current_user = get_jwt_user()
    target_user = User.query.get(user_id)

    if not target_user:
        return {'error': 'User not found'}, 404

    if current_user and current_user.id == user_id:
        return {'error': 'You cannot delete your own account from this endpoint'}, 400

    if target_user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return {'error': 'Cannot delete the last admin account'}, 400

    claimed_card_count = Card.query.filter_by(assigned_user_id=target_user.id, claim_status=True).count()
    if claimed_card_count > 0:
        return {'error': 'This user has permanently assigned claimed cards and cannot be deleted'}, 400

    for card in list(target_user.cards):
        card.assigned_user_id = None
        card.status = 'unassigned'
        card.claim_status = False
        card.claimed_at = None
        card.assigned_at = None

    if target_user.profile:
        db.session.delete(target_user.profile)

    db.session.delete(target_user)
    db.session.commit()

    return {'message': 'User deleted successfully'}, 200


@bp.route('/users/invite', methods=['POST'])
@require_role('admin')
def invite_user():
    """Create a platform user with a temporary password."""
    data = request.get_json() or {}

    required_fields = ['email', 'first_name', 'last_name']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return {'error': f"Missing fields: {', '.join(missing_fields)}"}, 400

    email = data['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        return {'error': 'Email already registered'}, 400

    role = data.get('role', 'employee')
    if role not in ['admin', 'company_admin', 'employee']:
        return {'error': 'Invalid role'}, 400

    company_id = data.get('company_id') or None
    if company_id and not Company.query.get(company_id):
        return {'error': 'Company not found'}, 404

    temporary_password = data.get('temporary_password') or secrets.token_urlsafe(10)

    user = User(
        email=email,
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        role=role,
        company_id=company_id,
    )
    user.set_password(temporary_password)
    db.session.add(user)
    db.session.flush()

    profile = Profile(
        user_id=user.id,
        public_slug=data.get('public_slug') or f"{user.first_name.lower()}{user.last_name.lower()}{user.id[:4]}",
    )

    if company_id:
        policy = CompanyPolicy.query.filter_by(company_id=company_id).first()
        template = policy.profile_template if policy and policy.profile_template else {}
        editable = set(policy.editable_fields or []) if policy else set()
        for field, value in template.items():
            if field in editable:
                continue
            if hasattr(profile, field):
                setattr(profile, field, value)

    db.session.add(profile)
    db.session.commit()

    return {
        'message': 'User invited successfully',
        'user': user.to_dict(),
        'temporary_password': temporary_password,
    }, 201


@bp.route('/customers', methods=['GET'])
@require_role('admin')
def list_customers():
    """List customer accounts with profile data (admin only)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    search = request.args.get('search')
    company_id = request.args.get('company_id')

    query = User.query.filter(User.role.in_(['employee', 'company_admin']))

    if status:
        query = query.filter_by(status=status)

    if company_id:
        query = query.filter_by(company_id=company_id)

    if search:
        search_like = f'%{search.strip()}%'
        query = query.filter(
            db.or_(
                User.first_name.ilike(search_like),
                User.last_name.ilike(search_like),
                User.email.ilike(search_like),
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    customers = []
    for user in pagination.items:
        profile = user.profile
        customers.append({
            'user': user.to_dict(),
            'profile': profile.to_dict(include_sensitive=True) if profile else None,
            'company': {
                'id': user.company.id,
                'name': user.company.name,
                'slug': user.company.slug,
            } if user.company else None,
            'card': user.cards[0].to_dict() if user.cards else None,
        })

    return {
        'customers': customers,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }, 200


@bp.route('/customers/<user_id>', methods=['GET'])
@require_role('admin')
def get_customer(user_id):
    """Get a single customer account with profile data."""
    user = User.query.get(user_id)
    if not user or user.role not in ['employee', 'company_admin']:
        return {'error': 'Customer not found'}, 404

    return {
        'customer': {
            'user': user.to_dict(),
            'profile': user.profile.to_dict(include_sensitive=True) if user.profile else None,
            'company': {
                'id': user.company.id,
                'name': user.company.name,
                'slug': user.company.slug,
            } if user.company else None,
            'card': user.cards[0].to_dict() if user.cards else None,
        }
    }, 200


@bp.route('/customers/<user_id>', methods=['PATCH'])
@require_role('admin')
def update_customer(user_id):
    """Update customer user/profile fields (admin only)."""
    user = User.query.get(user_id)
    if not user or user.role not in ['employee', 'company_admin']:
        return {'error': 'Customer not found'}, 404

    data = request.get_json() or {}

    if 'first_name' in data and str(data['first_name']).strip():
        user.first_name = str(data['first_name']).strip()

    if 'last_name' in data and str(data['last_name']).strip():
        user.last_name = str(data['last_name']).strip()

    if 'status' in data:
        if data['status'] not in ['active', 'inactive', 'suspended']:
            return {'error': 'Invalid status'}, 400
        user.status = data['status']

    profile = user.profile
    if not profile:
        base_slug = f"{user.first_name}{user.last_name}".lower().replace(' ', '') or 'customer'
        slug_candidate = base_slug
        counter = 1
        while Profile.query.filter_by(public_slug=slug_candidate).first():
            counter += 1
            slug_candidate = f"{base_slug}{counter}"

        profile = Profile(user_id=user.id, public_slug=slug_candidate)
        db.session.add(profile)

    profile_fields = {
        'public_slug', 'title', 'bio', 'phone', 'whatsapp', 'email_public',
        'website', 'location', 'photo_url', 'linkedin_url', 'twitter_url',
        'instagram_url', 'cover_color', 'button_style', 'font_style',
        'background_image_url', 'background_overlay_opacity',
        'background_blur_strength', 'section_order', 'layout_mode',
        'section_positions', 'social_links_json',
        'contact_action_order', 'enabled_contact_actions', 'name_size',
        'title_size', 'bio_size', 'photo_size', 'photo_offset_y', 'name_bold',
        'title_bold', 'bio_bold', 'body_background_color', 'body_text_color',
        'body_background_image_url', 'action_hover_color', 'show_exchange_contact'
    }

    if 'public_slug' in data:
        new_slug = str(data['public_slug']).strip()
        if not new_slug:
            return {'error': 'public_slug cannot be empty'}, 400

        existing_slug = Profile.query.filter_by(public_slug=new_slug).first()
        if existing_slug and existing_slug.user_id != user.id:
            return {'error': 'Public slug already taken'}, 400

    for field in profile_fields:
        if field in data:
            setattr(profile, field, data[field])

    profile.updated_at = datetime.utcnow()
    db.session.commit()

    return {
        'message': 'Customer updated successfully',
        'customer': {
            'user': user.to_dict(),
            'profile': profile.to_dict(include_sensitive=True),
            'company': {
                'id': user.company.id,
                'name': user.company.name,
                'slug': user.company.slug,
            } if user.company else None,
            'card': user.cards[0].to_dict() if user.cards else None,
        }
    }, 200


@bp.route('/cards/<card_id>/status', methods=['PATCH'])
@require_role('admin')
def update_card_status(card_id):
    """Update card status (admin only)."""
    data = request.get_json() or {}
    new_status = data.get('status')

    if new_status not in ['active', 'unassigned', 'assigned', 'personal', 'suspended', 'retired']:
        return {'error': 'Invalid status'}, 400

    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404

    if card.claim_status and new_status in ['unassigned', 'retired']:
        return {'error': 'Claimed cards are permanently assigned and cannot be unassigned or retired'}, 400

    card.status = new_status
    db.session.commit()

    return {
        'message': 'Card status updated',
        'card': card.to_dict(),
    }, 200


@bp.route('/companies/<company_id>/cards/generate', methods=['POST'])
@require_role('admin')
def generate_company_cards(company_id):
    """Generate cards for any company from the admin area."""
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    data = request.get_json() or {}
    try:
        count = max(1, min(int(data.get('count', 5)), 100))
    except (TypeError, ValueError):
        return {'error': 'Invalid count'}, 400

    created_cards = []
    for _ in range(count):
        code = f"NTW{secrets.token_hex(4).upper()}"
        while Card.query.filter_by(code=code).first():
            code = f"NTW{secrets.token_hex(4).upper()}"

        card = Card(
            company_id=company_id,
            code=code,
            short_code=_new_card_short_code(),
            status='unassigned',
        )
        db.session.add(card)
        created_cards.append(card)

    db.session.commit()

    return {
        'message': 'Cards generated successfully',
        'cards': [card.to_dict() for card in created_cards],
    }, 201


@bp.route('/cards/generate', methods=['POST'])
@require_role('admin')
def generate_cards_compat():
    """Compatibility endpoint: generate cards using company_id in JSON payload."""
    data = request.get_json() or {}
    scope = str(data.get('scope') or 'company').strip().lower()
    company_id = data.get('company_id') or None

    if scope not in ['company', 'personal']:
        return {'error': 'Invalid scope'}, 400

    if scope == 'company':
        if not company_id:
            return {'error': 'company_id is required'}, 400

        company = Company.query.get(company_id)
        if not company:
            return {'error': 'Company not found'}, 404
    else:
        company_id = None

    try:
        count = max(1, min(int(data.get('count', 5)), 100))
    except (TypeError, ValueError):
        return {'error': 'Invalid count'}, 400

    created_cards = []
    for _ in range(count):
        code = f"NTW{secrets.token_hex(4).upper()}"
        while Card.query.filter_by(code=code).first():
            code = f"NTW{secrets.token_hex(4).upper()}"

        card = Card(
            company_id=company_id,
            code=code,
            short_code=_new_card_short_code(),
            status='personal' if scope == 'personal' else 'unassigned',
        )
        db.session.add(card)
        created_cards.append(card)

    db.session.commit()

    return {
        'message': 'Cards generated successfully',
        'cards': [card.to_dict() for card in created_cards],
    }, 201


@bp.route('/cards-create', methods=['POST'])
@require_role('admin')
def generate_cards_emergency():
    """Emergency-compatible endpoint for card generation."""
    data = request.get_json() or {}
    company_id = data.get('company_id')
    if not company_id:
        return {'error': 'company_id is required'}, 400

    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    try:
        count = max(1, min(int(data.get('count', 5)), 100))
    except (TypeError, ValueError):
        return {'error': 'Invalid count'}, 400

    created_cards = []
    for _ in range(count):
        code = f"NTW{secrets.token_hex(4).upper()}"
        while Card.query.filter_by(code=code).first():
            code = f"NTW{secrets.token_hex(4).upper()}"

        card = Card(
            company_id=company_id,
            code=code,
            short_code=_new_card_short_code(),
            status='unassigned',
        )
        db.session.add(card)
        created_cards.append(card)

    db.session.commit()

    return {
        'message': 'Cards generated successfully',
        'cards': [card.to_dict() for card in created_cards],
    }, 201
