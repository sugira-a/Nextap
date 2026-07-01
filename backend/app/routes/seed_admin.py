"""
TEMPORARY one-time admin seed endpoint.
Protected by SEED_SECRET env variable.
DELETE THIS FILE after use.
"""
from flask import Blueprint, request
from ..extensions import db
from ..models import User, Profile
from datetime import datetime
import os

bp = Blueprint('seed_admin', __name__, url_prefix='/api/_seed')

SEED_SECRET = os.getenv('SEED_SECRET', '')

@bp.route('/admin', methods=['POST'])
def seed_admin():
    # Must have SEED_SECRET set and match
    if not SEED_SECRET:
        return {'error': 'Disabled'}, 403

    data = request.get_json(silent=True) or {}
    if data.get('secret') != SEED_SECRET:
        return {'error': 'Forbidden'}, 403

    email    = (data.get('email') or 'admin@nextap.com').strip().lower()
    password = (data.get('password') or '').strip()
    if not password or len(password) < 8:
        return {'error': 'password must be at least 8 characters'}, 400

    user = User.query.filter_by(email=email).first()
    if user:
        # Reset password and ensure admin role
        user.set_password(password)
        user.role = 'admin'
        user.status = 'active'
        db.session.commit()
        return {'message': f'Admin password reset for {email}'}, 200

    # Create new admin
    user = User(
        email=email,
        first_name=data.get('first_name', 'Admin'),
        last_name=data.get('last_name', 'User'),
        role='admin',
        status='active',
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    slug = f"admin-{user.id[:8]}"
    profile = Profile(user_id=user.id, public_slug=slug)
    db.session.add(profile)
    db.session.commit()

    return {'message': f'Admin created: {email}'}, 201
