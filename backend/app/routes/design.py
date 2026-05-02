import json
import sys

from flask import Blueprint, request
from ..extensions import db
from ..models import CardDesign, Profile, User
from ..utils.auth import get_jwt_user

bp = Blueprint('design', __name__, url_prefix='/api/designs')

print(f"[DEBUG] Design blueprint created with url_prefix='/api/designs'", file=sys.stderr)

COMPANY_SYNC_DESIGN_NAME = "Company Standard Layout"


# ── helpers ──────────────────────────────────────────────────────────────────

def _auth_profile():
    """Return (user, profile) or raise an error tuple."""
    user = get_jwt_user()
    if not user:
        return None, None, ({'error': 'Authentication required'}, 401)
    had_profile = bool(user.profile)
    profile = _ensure_member_profile(user)
    if not had_profile:
        db.session.commit()
    return user, profile, None


def _ensure_member_profile(user):
    if user.profile:
        return user.profile

    base = f"{(user.first_name or '').strip()}{(user.last_name or '').strip()}".lower().replace(' ', '')
    base_slug = base or 'employee'
    candidate = base_slug
    suffix = 1
    while Profile.query.filter_by(public_slug=candidate).first():
        suffix += 1
        candidate = f"{base_slug}{suffix}"

    profile = Profile(user_id=user.id, public_slug=candidate)
    db.session.add(profile)
    db.session.flush()
    return profile


def _apply_design_to_company_members(source_design, company_id):
    members = User.query.filter_by(company_id=company_id).all()
    applied_profiles = 0

    for member in members:
        # Company sync targets customer/member profiles, never system admins.
        if member.role == 'admin':
            continue

        profile = _ensure_member_profile(member)

        CardDesign.query.filter_by(profile_id=profile.id).update({'is_active': False})

        existing = CardDesign.query.filter_by(
            profile_id=profile.id,
            name=COMPANY_SYNC_DESIGN_NAME,
        ).first()

        if existing:
            existing.elements_json = source_design.elements_json
            existing.bg_json = source_design.bg_json
            existing.template_id = source_design.template_id
            existing.is_active = True
        else:
            db.session.add(CardDesign(
                profile_id=profile.id,
                name=COMPANY_SYNC_DESIGN_NAME,
                elements_json=source_design.elements_json,
                bg_json=source_design.bg_json,
                template_id=source_design.template_id,
                is_active=True,
            ))

        applied_profiles += 1

    return applied_profiles


# ── authenticated endpoints ───────────────────────────────────────────────────

@bp.route('', methods=['GET'])
def list_designs():
    """List all designs belonging to the authenticated user."""
    import sys
    print(f"[DEBUG] list_designs() called", file=sys.stderr)
    user, profile, err = _auth_profile()
    if err:
        return err

    designs = (
        CardDesign.query
        .filter_by(profile_id=profile.id)
        .order_by(CardDesign.created_at.desc())
        .limit(50)
        .all()
    )
    return {'designs': [d.to_dict() for d in designs]}, 200


@bp.route('', methods=['POST'])
def create_design():
    """Save a new design."""
    import sys
    user, profile, err = _auth_profile()
    if err:
        return err

    try:
        data = request.get_json(silent=True) or {}
        design = CardDesign(
            profile_id=profile.id,
            name=(data.get('name') or '').strip() or 'My Design',
            elements_json=json.dumps(data.get('elements', [])),
            bg_json=json.dumps(data.get('bg', {})),
            template_id=data.get('template_id'),
        )
        db.session.add(design)
        db.session.commit()
        print(f"[DEBUG] Design {design.id} created successfully for profile {profile.id}", file=sys.stderr)
        return {'design': design.to_dict()}, 201
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to create design: {str(e)}", file=sys.stderr)
        return {'error': f'Failed to save design: {str(e)}'}, 500


@bp.route('/<design_id>', methods=['PUT'])
def update_design(design_id):
    """Update an existing design."""
    import sys
    user, profile, err = _auth_profile()
    if err:
        return err

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        return {'error': 'Design not found'}, 404

    try:
        data = request.get_json(silent=True) or {}
        if 'name' in data:
            design.name = (data['name'] or '').strip() or design.name
        if 'elements' in data:
            design.elements_json = json.dumps(data['elements'])
        if 'bg' in data:
            design.bg_json = json.dumps(data['bg'])
        if 'template_id' in data:
            design.template_id = data['template_id']

        db.session.commit()
        print(f"[DEBUG] Design {design_id} updated successfully", file=sys.stderr)
        return {'design': design.to_dict()}, 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to update design {design_id}: {str(e)}", file=sys.stderr)
        return {'error': f'Failed to update design: {str(e)}'}, 500


@bp.route('/<design_id>', methods=['DELETE'])
def delete_design(design_id):
    """Delete a design."""
    user, profile, err = _auth_profile()
    if err:
        return err

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        return {'error': 'Design not found'}, 404

    db.session.delete(design)
    db.session.commit()
    return {'message': 'Design deleted'}, 200


@bp.route('/<design_id>/activate', methods=['POST'])
def activate_design(design_id):
    """Mark a design as the active card layout (deactivates others)."""
    user, profile, err = _auth_profile()
    if err:
        return err

    # Deactivate all designs for this profile first
    CardDesign.query.filter_by(profile_id=profile.id).update({'is_active': False})

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        db.session.rollback()
        return {'error': 'Design not found'}, 404

    design.is_active = True
    db.session.commit()
    return {'design': design.to_dict()}, 200


@bp.route('/<design_id>/deactivate', methods=['POST'])
def deactivate_design(design_id):
    """Remove active status from a design."""
    user, profile, err = _auth_profile()
    if err:
        return err

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        return {'error': 'Design not found'}, 404

    design.is_active = False
    db.session.commit()
    return {'design': design.to_dict()}, 200


@bp.route('/<design_id>/apply-company', methods=['POST'])
def apply_design_to_company(design_id):
    """Apply one design to all profiles in a company and mark it active for them."""
    user, profile, err = _auth_profile()
    if err:
        return err

    if user.role not in ['admin', 'company_admin']:
        return {'error': 'Only admins can apply company-wide designs'}, 403

    payload = request.get_json(silent=True) or {}
    company_id = (payload.get('company_id') or user.company_id or '').strip()
    if not company_id:
        return {'error': 'company_id is required'}, 400

    if user.role != 'admin' and user.company_id != company_id:
        return {'error': 'Access denied for this company'}, 403

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        return {'error': 'Design not found'}, 404

    try:
        applied_profiles = _apply_design_to_company_members(design, company_id)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {'error': 'Failed to apply design to company members'}, 500

    return {
        'message': 'Design applied to company members',
        'applied_profiles': applied_profiles,
        'company_id': company_id,
    }, 200


@bp.route('/active', methods=['GET'])
def get_active_design():
    """Return the current user's active design (or null)."""
    user, profile, err = _auth_profile()
    if err:
        return err

    design = CardDesign.query.filter_by(profile_id=profile.id, is_active=True).first()
    return {'design': design.to_dict() if design else None}, 200


# ── public endpoint ───────────────────────────────────────────────────────────

@bp.route('/public/<slug>', methods=['GET'])
def get_public_active_design(slug):
    """Return the active design for a public profile slug (no auth required)."""
    profile = Profile.query.filter_by(public_slug=slug).first()
    if not profile:
        return {'error': 'Profile not found'}, 404

    design = CardDesign.query.filter_by(profile_id=profile.id, is_active=True).first()
    return {'design': design.to_dict() if design else None}, 200
