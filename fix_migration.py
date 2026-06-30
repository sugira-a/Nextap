#!/usr/bin/env python
"""Clean and run database migrations"""

import os
import sqlite3
from pathlib import Path

# Check database file
db_path = Path('instance/app.db')

if db_path.exists():
    try:
        # Connect and check tables
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'")
        has_alembic = cursor.fetchone() is not None
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Database exists at: {db_path}")
        print(f"Tables: {tables}")
        print(f"Has alembic_version: {has_alembic}")
        
        # Drop alembic version table if it exists to reset migration state
        if has_alembic:
            cursor.execute("DELETE FROM alembic_version")
            conn.commit()
            print("[OK] Reset migration state")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error checking database: {e}")
else:
    print("Database doesn't exist yet")

print("\nAttempting migration...")

os.environ['FLASK_APP'] = 'backend.app:create_app'
os.environ['FLASK_ENV'] = 'development'

from backend.app import create_app, db
from alembic.config import Config
from alembic import command
from sqlalchemy import text, inspect

app = create_app('development')
with app.app_context():
    # Clean up temp tables
    inspector = inspect(db.engine)
    temp_tables = [t for t in inspector.get_table_names() if t.startswith('_alembic_tmp')]
    if temp_tables:
        print("[CLEAN] Cleaning up temp tables: " + str(temp_tables))
        with db.engine.connect() as conn:
            for table in temp_tables:
                conn.execute(text(f'DROP TABLE IF EXISTS "{table}"'))
            conn.commit()
    
    migrations_dir = Path(__file__).parent / 'backend' / 'migrations'
    alembic_cfg = Config(str(migrations_dir / 'alembic.ini'))
    alembic_cfg.set_main_option('script_location', str(migrations_dir))
    
    try:
        command.upgrade(alembic_cfg, 'head')
        print("[OK] Migration successful!")
    except Exception as e:
        print(f"[ERROR] Migration error: {e}")
        import traceback
        traceback.print_exc()
