"""
URL Shortener routes
- /api/shortlinks  — admin CRUD
- /s/<alias>       — public redirect
"""
from flask import Blueprint, request, redirect, abort
from ..extensions import db
from ..models import ShortLink
from ..utils.auth import require_role, get_jwt_user
from datetime import datetime
import secrets
import string

bp = Blueprint('shortlink', __name__, url_prefix='/api/shortlinks')
redirect_bp = Blueprint('shortlink_redirect', __name__, url_prefix='/s')


# ── helpers ──────────────────────────────────────────────────────────────────

def _random_alias(length: int = 7) -> str:
    alphabet = string.ascii_lowercase + string.digits
    for _ in range(20):
        candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
        if not ShortLink.query.filter_by(alias=candidate).first():
            return candidate
    raise RuntimeError("Could not generate unique alias")


def _normalize_url(url: str) -> str:
    url = url.strip()
    if url and not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url


# ── public redirect ───────────────────────────────────────────────────────────

@redirect_bp.route('/<string:alias>', methods=['GET'])
def follow(alias: str):
    """Redirect visitor to original URL and increment click counter."""
    link = ShortLink.query.filter_by(alias=alias, is_active=True).first()
    if not link:
        abort(404)
    link.click_count = (link.click_count or 0) + 1
    link.last_visited_at = datetime.utcnow()
    db.session.commit()
    return redirect(link.original_url, code=302)


# ── admin CRUD ────────────────────────────────────────────────────────────────

@bp.route('', methods=['GET'])
@require_role('admin')
def list_links():
    """List all short links with optional search."""
    q = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)

    query = ShortLink.query.order_by(ShortLink.created_at.desc())
    if q:
        like = f'%{q}%'
        query = query.filter(
            ShortLink.alias.ilike(like) |
            ShortLink.original_url.ilike(like) |
            ShortLink.title.ilike(like)
        )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'links': [l.to_dict() for l in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages,
    }, 200


@bp.route('', methods=['POST'])
@require_role('admin')
def create_link():
    """Create a new short link."""
    user = get_jwt_user()
    data = request.get_json(silent=True) or {}

    original_url = _normalize_url(data.get('original_url', ''))
    if not original_url:
        return {'error': 'original_url is required'}, 400

    alias = (data.get('alias') or '').strip().lower()
    if alias:
        # Validate alias: alphanumeric + hyphens only
        allowed = set(string.ascii_lowercase + string.digits + '-_')
        if not all(c in allowed for c in alias):
            return {'error': 'Alias may only contain letters, numbers, hyphens and underscores'}, 400
        if ShortLink.query.filter_by(alias=alias).first():
            return {'error': 'That alias is already taken'}, 409
    else:
        alias = _random_alias()

    link = ShortLink(
        alias=alias,
        original_url=original_url,
        title=(data.get('title') or '').strip() or None,
        is_active=True,
        click_count=0,
        created_by=user.id if user else None,
    )
    db.session.add(link)
    db.session.commit()
    return {'link': link.to_dict()}, 201


@bp.route('/<string:link_id>', methods=['PUT'])
@require_role('admin')
def update_link(link_id: str):
    """Update destination URL, alias, title, or active status."""
    link = ShortLink.query.get(link_id)
    if not link:
        return {'error': 'Not found'}, 404

    data = request.get_json(silent=True) or {}

    if 'original_url' in data:
        url = _normalize_url(data['original_url'])
        if not url:
            return {'error': 'original_url cannot be empty'}, 400
        link.original_url = url

    if 'alias' in data:
        new_alias = (data['alias'] or '').strip().lower()
        if new_alias and new_alias != link.alias:
            allowed = set(string.ascii_lowercase + string.digits + '-_')
            if not all(c in allowed for c in new_alias):
                return {'error': 'Alias may only contain letters, numbers, hyphens and underscores'}, 400
            if ShortLink.query.filter_by(alias=new_alias).first():
                return {'error': 'That alias is already taken'}, 409
            link.alias = new_alias

    if 'title' in data:
        link.title = (data['title'] or '').strip() or None

    if 'is_active' in data:
        link.is_active = bool(data['is_active'])

    link.updated_at = datetime.utcnow()
    db.session.commit()
    return {'link': link.to_dict()}, 200


@bp.route('/<string:link_id>', methods=['DELETE'])
@require_role('admin')
def delete_link(link_id: str):
    """Permanently delete a short link."""
    link = ShortLink.query.get(link_id)
    if not link:
        return {'error': 'Not found'}, 404
    db.session.delete(link)
    db.session.commit()
    return {'message': 'Deleted'}, 200
