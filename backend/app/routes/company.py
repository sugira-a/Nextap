from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Company, Department, CompanyPolicy, User, Card, Profile
from ..utils.auth import get_jwt_user, require_role, validate_request_json
from datetime import datetime
import secrets
import string

bp = Blueprint('company', __name__, url_prefix='/api/company')


def _new_card_short_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
    while Card.query.filter_by(short_code=candidate).first():
        candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
    return candidate


@bp.route('/create', methods=['POST'])
@validate_request_json('name', 'slug')
@require_role('admin')
def create_company():
    """Create a new company (admin only)"""
    data = request.get_json()
    
    # Check if slug already exists
    if Company.query.filter_by(slug=data['slug']).first():
        return {'error': 'Company slug already exists'}, 400
    
    user = get_jwt_user()

    admin_email = data.get('admin_email')
    admin_password = data.get('admin_password')
    admin_first_name = data.get('admin_first_name', 'Company')
    admin_last_name = data.get('admin_last_name', 'Admin')

    if admin_email and User.query.filter_by(email=admin_email).first():
        return {'error': 'Company admin email already exists'}, 400

    created_admin_user = None

    company = Company(
        name=data['name'],
        slug=data['slug'],
        logo_url=data.get('logo_url'),
        primary_color=data.get('primary_color', '#000000'),
        accent_color=data.get('accent_color', '#22C55E'),
        plan=data.get('plan', 'starter'),
        admin_user_id=user.id
    )
    
    db.session.add(company)
    db.session.flush()
    
    # Create default policy
    policy = CompanyPolicy(
        company_id=company.id,
        required_fields=['title', 'photo_url'],
        editable_fields=['title', 'bio', 'phone', 'whatsapp', 'email_public', 'website', 'location', 'photo_url'],
        approval_required=False,
        auto_approve=True
    )
    db.session.add(policy)

    if admin_email:
        if not admin_password:
            admin_password = secrets.token_urlsafe(10)

        created_admin_user = User(
            email=admin_email,
            first_name=admin_first_name,
            last_name=admin_last_name,
            role='company_admin',
            company_id=company.id,
            status='active'
        )
        created_admin_user.set_password(admin_password)
        db.session.add(created_admin_user)
        db.session.flush()

        base_slug = f"{admin_first_name}{admin_last_name}".lower().replace(' ', '') or 'companyadmin'
        slug_candidate = base_slug
        counter = 1
        while Profile.query.filter_by(public_slug=slug_candidate).first():
            counter += 1
            slug_candidate = f"{base_slug}{counter}"

        profile = Profile(
            user_id=created_admin_user.id,
            public_slug=slug_candidate
        )
        db.session.add(profile)

        company.admin_user_id = created_admin_user.id

    db.session.commit()

    response = {
        'message': 'Company created successfully',
        'company': company.to_dict()
    }

    if created_admin_user:
        response['company_admin'] = {
            'id': created_admin_user.id,
            'email': created_admin_user.email,
            'first_name': created_admin_user.first_name,
            'last_name': created_admin_user.last_name,
            'role': created_admin_user.role,
            'temporary_password': admin_password
        }
    
    return response, 201


@bp.route('/<company_id>', methods=['GET'])
def get_company(company_id):
    """Get company details"""
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    user = get_jwt_user()
    
    # Check if user has access
    if user and user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    return {
        'company': company.to_dict(),
        'stats': {
            'total_employees': len(company.users),
            'total_cards': len(company.cards),
            'active_cards': len([c for c in company.cards if c.status == 'active'])
        }
    }, 200


@bp.route('/<company_id>/update', methods=['PUT'])
@validate_request_json('name')
def update_company(company_id):
    """Update company details (admin only)"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    data = request.get_json()
    
    if 'name' in data:
        company.name = data['name']
    if 'logo_url' in data:
        company.logo_url = data['logo_url']
    if 'primary_color' in data:
        company.primary_color = data['primary_color']
    if 'accent_color' in data:
        company.accent_color = data['accent_color']
    if 'plan' in data:
        company.plan = data['plan']
    if 'status' in data and data['status'] in ['active', 'inactive', 'suspended']:
        company.status = data['status']
    if 'subscription_seats' in data:
        company.subscription_seats = data['subscription_seats']
    
    company.updated_at = datetime.utcnow()
    db.session.commit()
    
    return {
        'message': 'Company updated successfully',
        'company': company.to_dict()
    }, 200


@bp.route('/<company_id>', methods=['DELETE'])
def delete_company(company_id):
    """Decommission company workspace and detach users/cards."""
    user = get_jwt_user()

    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403

    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    # Retire all company cards and remove assignments.
    for card in company.cards:
        card.status = 'retired'
        card.assigned_user_id = None
        card.assigned_at = None
        card.claim_status = False
        card.claimed_at = None

    # Revoke all pending invitations.
    for invitation in company.invitations:
        if invitation.status == 'pending':
            invitation.status = 'revoked'

    # Detach users from this workspace.
    for member in company.users:
        member.company_id = None
        if member.role == 'company_admin':
            member.role = 'employee'
        member.status = 'inactive'

    company.status = 'inactive'
    company.updated_at = datetime.utcnow()
    db.session.commit()

    return {
        'message': 'Company workspace deleted successfully'
    }, 200


@bp.route('/<company_id>/policy', methods=['GET', 'PUT'])
def manage_company_policy(company_id):
    """Get or update company policy"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    policy = company.policies
    
    if request.method == 'GET':
        if not policy:
            return {'error': 'Policy not found'}, 404
        return {'policy': policy.to_dict()}, 200
    
    # PUT request
    data = request.get_json()
    
    if not policy:
        policy = CompanyPolicy(company_id=company_id)
    
    if 'required_fields' in data:
        policy.required_fields = data['required_fields']
    if 'editable_fields' in data:
        policy.editable_fields = data['editable_fields']
    if 'approval_required' in data:
        policy.approval_required = data['approval_required']
    if 'auto_approve' in data:
        policy.auto_approve = data['auto_approve']
    if 'allow_custom_branding' in data:
        policy.allow_custom_branding = data['allow_custom_branding']
    
    policy.updated_at = datetime.utcnow()
    db.session.add(policy)
    db.session.commit()
    
    return {
        'message': 'Policy updated successfully',
        'policy': policy.to_dict()
    }, 200


@bp.route('/<company_id>/members', methods=['GET'])
def get_company_members(company_id):
    """Get company employees"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')  # optional filter
    
    query = User.query.filter_by(company_id=company_id)
    
    if status:
        query = query.filter_by(status=status)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return {
        'members': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/<company_id>/cards', methods=['GET'])
def get_company_cards(company_id):
    """Get company cards"""
    user = get_jwt_user()

    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403

    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    search = request.args.get('search')

    query = Card.query.filter_by(company_id=company_id)

    if status and status != 'all':
        query = query.filter_by(status=status)

    if search:
        query = query.filter(
            db.or_(
                Card.code.ilike(f'%{search}%'),
                Card.serial_number.ilike(f'%{search}%')
            )
        )

    pagination = query.order_by(Card.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    cards = []
    for card in pagination.items:
        card_data = card.to_dict()
        card_data['assigned_user'] = card.assigned_user.to_dict() if card.assigned_user else None
        cards.append(card_data)

    return {
        'cards': cards,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/<company_id>/cards/generate', methods=['POST'])
def generate_company_cards(company_id):
    """Generate a batch of cards for a company."""
    user = get_jwt_user()

    if not user or (user.role not in ['admin', 'company_admin']):
        return {'error': 'Access denied'}, 403

    if user.role != 'admin' and user.company_id != company_id:
        return {'error': 'Access denied'}, 403

    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404

    data = request.get_json() or {}
    count = max(1, min(int(data.get('count', 5)), 100))

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
        'cards': [card.to_dict() for card in created_cards]
    }, 201


@bp.route('/cards/generate', methods=['POST'])
def generate_company_cards_compat():
    """Compatibility endpoint: generate cards using company_id in JSON payload."""
    user = get_jwt_user()
    if not user or (user.role not in ['admin', 'company_admin']):
        return {'error': 'Access denied'}, 403

    data = request.get_json() or {}
    company_id = data.get('company_id')
    if not company_id:
        return {'error': 'company_id is required'}, 400

    if user.role != 'admin' and user.company_id != company_id:
        return {'error': 'Access denied'}, 403

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
        'cards': [card.to_dict() for card in created_cards]
    }, 201


@bp.route('/<company_id>/stats', methods=['GET'])
def get_company_stats(company_id):
    """Get company statistics"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    employees = company.users
    cards = company.cards
    
    return {
        'stats': {
            'total_employees': len(employees),
            'active_employees': len([e for e in employees if e.status == 'active']),
            'total_cards': len(cards),
            'active_cards': len([c for c in cards if c.status == 'active']),
            'claimed_cards': len([c for c in cards if c.claim_status]),
            'unassigned_cards': len([c for c in cards if c.status == 'unassigned']),
            'pending_invitations': Company.query.get(company_id).invitations.__len__(),
        }
    }, 200
