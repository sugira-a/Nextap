from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, Company, Department, Card, AuditLog
from app.utils.auth import get_jwt_user, require_company_member, validate_request_json
from datetime import datetime

bp = Blueprint('employee', __name__, url_prefix='/api/company/<company_id>/employees')


@bp.route('', methods=['GET'])
def list_employees(company_id):
    """List all employees in a company"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    # Filters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    department_id = request.args.get('department_id')
    search = request.args.get('search')
    
    query = User.query.filter_by(company_id=company_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if department_id:
        query = query.filter_by(department_id=department_id)
    
    if search:
        query = query.filter(
            db.or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    employees = []
    for emp in pagination.items:
        emp_data = emp.to_dict()
        emp_data['card'] = emp.cards[0].to_dict() if emp.cards else None
        emp_data['profile'] = emp.profile.to_dict(include_sensitive=True) if emp.profile else None
        employees.append(emp_data)
    
    return {
        'employees': employees,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }, 200


@bp.route('/<employee_id>', methods=['GET'])
def get_employee(company_id, employee_id):
    """Get employee details"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    employee = User.query.get(employee_id)
    
    if not employee or employee.company_id != company_id:
        return {'error': 'Employee not found'}, 404
    
    emp_data = employee.to_dict()
    emp_data['card'] = employee.cards[0].to_dict() if employee.cards else None
    emp_data['profile'] = employee.profile.to_dict(include_sensitive=True) if employee.profile else None
    
    return {'employee': emp_data}, 200


@bp.route('/<employee_id>/update', methods=['PATCH'])
def update_employee(company_id, employee_id):
    """Update employee details (status, department, role)"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    employee = User.query.get(employee_id)
    
    if not employee or employee.company_id != company_id:
        return {'error': 'Employee not found'}, 404
    
    data = request.get_json()
    
    # Log changes
    changes = {}
    
    if 'status' in data:
        if data['status'] in ['active', 'inactive', 'suspended']:
            changes['status'] = {'from': employee.status, 'to': data['status']}
            employee.status = data['status']
    
    if 'department_id' in data:
        dept = Department.query.get(data['department_id'])
        if dept and dept.company_id == company_id:
            changes['department_id'] = {'from': employee.department_id, 'to': data['department_id']}
            employee.department_id = data['department_id']
    
    if 'role' in data:
        if data['role'] in ['employee', 'company_admin']:
            changes['role'] = {'from': employee.role, 'to': data['role']}
            employee.role = data['role']
    
    # Create audit log
    if changes:
        audit = AuditLog(
            actor_user_id=user.id,
            action='update_employee',
            target_type='user',
            target_id=employee_id,
            changes=changes,
            ip_address=request.remote_addr
        )
        db.session.add(audit)
    
    db.session.commit()
    
    emp_data = employee.to_dict()
    emp_data['card'] = employee.cards[0].to_dict() if employee.cards else None
    
    return {
        'message': 'Employee updated successfully',
        'employee': emp_data
    }, 200


@bp.route('/<employee_id>/remove', methods=['DELETE'])
def remove_employee(company_id, employee_id):
    """Remove employee from company"""
    user = get_jwt_user()
    
    if not user or user.role not in ['company_admin', 'admin']:
        return {'error': 'Access denied'}, 403
    
    if user.company_id != company_id and user.role != 'admin':
        return {'error': 'Access denied'}, 403
    
    employee = User.query.get(employee_id)
    
    if not employee or employee.company_id != company_id:
        return {'error': 'Employee not found'}, 404
    
    # Unassign cards
    for card in employee.cards:
        card.assigned_user_id = None
        card.status = 'unassigned'
        card.claim_status = False
    
    # Create audit log
    audit = AuditLog(
        actor_user_id=user.id,
        action='remove_employee',
        target_type='user',
        target_id=employee_id,
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    
    # Delete employee
    db.session.delete(employee)
    db.session.commit()
    
    return {'message': 'Employee removed successfully'}, 200
