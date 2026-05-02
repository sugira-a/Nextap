#!/usr/bin/env python
"""Debug script to check user password hash"""

import sys
import logging

# Suppress SQL logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

sys.path.insert(0, '.')

try:
    from app import create_app
    from app.models import User
except ModuleNotFoundError:
    from backend.app import create_app
    from backend.app.models import User

from werkzeug.security import check_password_hash

app = create_app()

with app.app_context():
    user = User.query.filter_by(email='sugiraruti@gmail.com').first()
    
    if not user:
        print("User not found!")
        sys.exit(1)
    
    print(f"\nUser: {user.email}", flush=True)
    print(f"First Name: {user.first_name}", flush=True)
    print(f"Status: {user.status}", flush=True)
    print(f"Password hash: {user.password_hash}", flush=True)
    print(f"Has password_hash: {bool(user.password_hash)}", flush=True)
    
    if not user.password_hash:
        print("\n✗ ERROR: User has no password hash set!", flush=True)
        sys.exit(1)
    
    print(f"\nPassword hash length: {len(user.password_hash)}", flush=True)
    print(f"Password hash starts with: {user.password_hash[:20]}...", flush=True)
    
    # Test with common passwords
    test_passwords = ['password', '123456', 'test', 'Test123!@#', 'sugiraruti']
    
    print(f"\nTesting passwords:", flush=True)
    for pwd in test_passwords:
        try:
            result = check_password_hash(user.password_hash, pwd)
            status = "✓ MATCH" if result else "✗ no match"
            print(f"  '{pwd}': {status}", flush=True)
        except Exception as e:
            print(f"  '{pwd}': ✗ Error - {e}", flush=True)
