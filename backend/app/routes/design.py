import json
import sys

from flask import Blueprint, request
from ..extensions import db
from ..models import CardDesign, Profile
from ..utils.auth import get_jwt_user

bp = Blueprint('design', __name__, url_prefix='/api/designs')

print(f"[DEBUG] Design blueprint created with url_prefix='/api/designs'", file=sys.stderr)


# ── helpers ──────────────────────────────────────────────────────────────────

def _auth_profile():
    """Return (user, profile) or raise an error tuple."""
    user = get_jwt_user()
    if not user:
        return None, None, ({'error': 'Authentication required'}, 401)
    if not user.profile:
        return None, None, ({'error': 'Profile not found'}, 404)
    return user, user.profile, None


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
        .all()
    )
    return {'designs': [d.to_dict() for d in designs]}, 200


@bp.route('', methods=['POST'])
def create_design():
    """Save a new design."""
    user, profile, err = _auth_profile()
    if err:
        return err

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
    return {'design': design.to_dict()}, 201


@bp.route('/<design_id>', methods=['PUT'])
def update_design(design_id):
    """Update an existing design."""
    user, profile, err = _auth_profile()
    if err:
        return err

    design = CardDesign.query.filter_by(id=design_id, profile_id=profile.id).first()
    if not design:
        return {'error': 'Design not found'}, 404

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
    return {'design': design.to_dict()}, 200


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
