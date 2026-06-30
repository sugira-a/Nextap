#!/usr/bin/env python
"""Utility script to run database migrations"""

import os
import sys
from pathlib import Path

# Set environment
os.environ['FLASK_APP'] = 'backend.app:create_app'
os.environ['FLASK_ENV'] = 'development'

# Change to script directory
os.chdir(Path(__file__).parent)

from backend.app import create_app, db
from alembic.config import Config
from alembic import command

try:
    app = create_app('development')
    with app.app_context():
        # Clean up any existing temporary migration tables
        from sqlalchemy import text, inspect
        inspector = inspect(db.engine)
        temp_tables = [t for t in inspector.get_table_names() if t.startswith('_alembic_tmp')]
        if temp_tables:
            print(f"⚠️  Cleaning up temporary tables: {temp_tables}")
            with db.engine.connect() as conn:
                for table in temp_tables:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}"'))
                conn.commit()
        
        migrations_dir = Path(__file__).parent / 'backend' / 'migrations'
        alembic_cfg = Config(str(migrations_dir / 'alembic.ini'))
        alembic_cfg.set_main_option('script_location', str(migrations_dir))
        command.upgrade(alembic_cfg, 'head')
        print("✅ Migrations applied successfully!")
except Exception as e:
    print(f"❌ Migration failed: {e}")
    sys.exit(1)
