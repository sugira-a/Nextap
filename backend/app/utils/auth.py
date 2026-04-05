from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models import User, Company
import json

# JWT token creation helpers
def create_tokens(user_id):
    """Create access and refresh tokens"""
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    return access_token, refresh_token


def get_jwt_user():
    """Get current authenticated user"""
    try:
        verify_jwt_in_request(optional=False)
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return user
    except:
        return None


# Role-based access control decorators
def require_role(*allowed_roles):
    """Decorator to restrict endpoint to specific roles"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=False)
                user = get_jwt_user()
                
                if not user:
                    return {'error': 'User not found'}, 404
                
                if user.role not in allowed_roles:
                    return {'error': 'Insufficient permissions'}, 403
                
                return fn(*args, **kwargs)
            except Exception as e:
                return {'error': 'Authentication required'}, 401
        
        return wrapper
    return decorator


def require_company_member():
    """Decorator to ensure user is a company member"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=False)
                user = get_jwt_user()
                
                if not user or not user.company_id:
                    return {'error': 'User is not part of a company'}, 403
                
                return fn(*args, **kwargs)
            except Exception as e:
                return {'error': 'Authentication required'}, 401
        
        return wrapper
    return decorator


def get_company_context():
    """Get the user's company context"""
    user = get_jwt_user()
    if not user or not user.company_id:
        return None
    return user.company


# Pagination helper
def paginate_query(query, page=1, per_page=20):
    """Paginate a SQLAlchemy query"""
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': [item.to_dict() if hasattr(item, 'to_dict') else item for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }


# Date helper
def add_days(date, days):
    """Add days to a datetime"""
    return date + timedelta(days=days)


# Request validation helper
def validate_request_json(*required_fields):
    """Decorator to validate required JSON fields"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return {'error': 'Request body must be JSON'}, 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return {
                    'error': 'Missing required fields',
                    'missing': missing_fields
                }, 400
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
