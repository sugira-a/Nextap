#!/usr/bin/env python
"""Check if API routes are registered"""

import sys
sys.path.insert(0, '.')

from backend.app import create_app

app = create_app()
routes = [str(rule) for rule in app.url_map.iter_rules() if '/api/' in str(rule)]

print("=" * 60)
print("API ROUTES REGISTERED:")
print("=" * 60)
for r in sorted(routes):
    print(f"  {r}")

# Specific checks
profile_routes = [r for r in routes if '/api/profile' in r]
design_routes = [r for r in routes if '/api/designs' in r]

print("\n" + "=" * 60)
print("PROFILE ROUTES:", len(profile_routes), "found")
print("=" * 60)
for r in profile_routes:
    print(f"  {r}")

print("\n" + "=" * 60)
print("DESIGN ROUTES:", len(design_routes), "found")
print("=" * 60)
for r in design_routes:
    print(f"  {r}")
