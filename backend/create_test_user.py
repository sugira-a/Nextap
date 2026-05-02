#!/usr/bin/env python
"""Script to create test user for debugging"""

import sys
import logging

# Disable SQLAlchemy logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

sys.path.insert(0, '.')

try:
    from app import create_app
    from app.models import User
    from app.extensions import db
except ModuleNotFoundError:
    from backend.app import create_app
    from backend.app.models import User
    from backend.app.extensions import db

app = create_app()

with app.app_context():
    email = 'sugiraruti@gmail.com'
    password = 'Test123!@#'
    
    # Check if user exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"User {email} already exists!", flush=True)
        sys.exit(0)
    
    # Create test user
    user = User(
        email=email,
        first_name='Test',
        last_name='User',
        role='employee'
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    print(f"✓ Created test user: {email}", flush=True)
    print(f"  Password: {password}", flush=True)
    print(f"  User ID: {user.id}", flush=True)
