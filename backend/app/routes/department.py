from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Department, Company, User
from app.utils.auth import get_jwt_user, validate_request_json
from datetime import datetime

bp = Blueprint('department', __name__, url_prefix='/api/company/<company_id>/departments')


@bp.route('', methods=['GET'])
def list_departments(company_id):
    """List all departments in company"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    departments = [d.to_dict() for d in company.departments]
    
    return {'departments': departments}, 200


@bp.route('/create', methods=['POST'])
@validate_request_json('name')
def create_department(company_id):
    """Create a new department"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    data = request.get_json()
    
    # Check if department name already exists in company
    existing = Department.query.filter_by(company_id=company_id, name=data['name']).first()
    if existing:
        return {'error': 'Department already exists'}, 400
    
    department = Department(
        company_id=company_id,
        name=data['name'],
        description=data.get('description')
    )
    
    db.session.add(department)
    db.session.commit()
    
    return {
        'message': 'Department created',
        'department': department.to_dict()
    }, 201


@bp.route('/<department_id>', methods=['GET'])
def get_department(company_id, department_id):
    """Get department details"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    department = Department.query.get(department_id)
    
    if not department or department.company_id != company_id:
        return {'error': 'Department not found'}, 404
    
    dept_data = department.to_dict()
    dept_data['employee_count'] = len(department.users)
    
    return {'department': dept_data}, 200


@bp.route('/<department_id>/update', methods=['PATCH'])
def update_department(company_id, department_id):
    """Update department"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    department = Department.query.get(department_id)
    
    if not department or department.company_id != company_id:
        return {'error': 'Department not found'}, 404
    
    data = request.get_json()
    
    if 'name' in data:
        # Check uniqueness
        existing = Department.query.filter(
            Department.company_id == company_id,
            Department.name == data['name'],
            Department.id != department_id
        ).first()
        if existing:
            return {'error': 'Department name already exists'}, 400
        department.name = data['name']
    
    if 'description' in data:
        department.description = data['description']
    
    department.updated_at = datetime.utcnow()
    db.session.commit()
    
    return {
        'message': 'Department updated',
        'department': department.to_dict()
    }, 200


@bp.route('/<department_id>/delete', methods=['DELETE'])
def delete_department(company_id, department_id):
    """Delete department"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    department = Department.query.get(department_id)
    
    if not department or department.company_id != company_id:
        return {'error': 'Department not found'}, 404
    
    # Check if department has members
    if len(department.users) > 0:
        return {'error': 'Cannot delete department with active members'}, 400
    
    db.session.delete(department)
    db.session.commit()
    
    return {'message': 'Department deleted'}, 200
