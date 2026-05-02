#!/usr/bin/env python
"""Check which blueprints are registered"""
import sys
sys.path.insert(0, '/Users/user/Desktop/Nextap/backend')

from app import create_app

try:
    app = create_app()
    print("Registered blueprints:")
    for name, bp in app.blueprints.items():
        print(f"  {name}")
    
    print("\nLooking for profile and design blueprints...")
    if 'profile' in app.blueprints:
        print("  ✓ profile blueprint is registered")
    else:
        print("  ✗ profile blueprint is MISSING")
        
    if 'design' in app.blueprints:
        print("  ✓ design blueprint is registered")
    else:
        print("  ✗ design blueprint is MISSING")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
