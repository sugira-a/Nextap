import os
import secrets
import string

from flask import Flask, jsonify, send_from_directory
from .config import config
from .extensions import init_extensions, db, jwt, migrate


def create_app(config_name='development'):
    """Flask application factory"""
    app = Flask(__name__)
    frontend_dist_dir = os.getenv(
        'FRONTEND_DIST_DIR',
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dist'))
    )
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    init_extensions(app)
    
    # Register blueprints FIRST so their routes take priority
    register_blueprints(app)
    
    # Root handler via error handler - let 404s serve SPA
    
    # Health check endpoint  
    @app.route('/health')
    def health():
        """Health check"""
        return jsonify({'status': 'ok'}), 200
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register CLI commands
    register_cli_commands(app)
    
    with app.app_context():
        if _should_run_db_bootstrap(app):
            db.create_all()
            if _is_sqlite_database():
                ensure_profile_schema()
                ensure_card_schema()
                ensure_shared_contact_schema()
                ensure_card_design_schema()
            seed_default_admin()
            seed_default_company()
    
    return app


def _is_sqlite_database() -> bool:
    return db.engine.dialect.name == 'sqlite'


def _should_run_db_bootstrap(app) -> bool:
    """Run dev-time DB bootstrap only when explicitly enabled or in debug/testing."""
    env_override = os.getenv('RUN_DB_BOOTSTRAP')
    if env_override is not None:
        return env_override.strip().lower() in {'1', 'true', 'yes', 'on'}

    # Production should not auto-bootstrap/seeding unless explicitly enabled.
    flask_env = os.getenv('FLASK_ENV', '').strip().lower()
    if flask_env == 'production':
        return False

    if app.config.get('SQLALCHEMY_DATABASE_URI', '').startswith('sqlite:'):
        return True

    return bool(app.debug or app.testing)


def seed_default_admin():
    """Create a default admin user for local development if none exists."""
    from .models import User, Profile

    admin_email = os.getenv('ADMIN_EMAIL', 'admin@nextap.local')
    admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!')
    admin_first_name = os.getenv('ADMIN_FIRST_NAME', 'System')
    admin_last_name = os.getenv('ADMIN_LAST_NAME', 'Admin')

    existing_admin = User.query.filter_by(role='admin').first()
    if existing_admin:
        return

    admin_user = User(
        first_name=admin_first_name,
        last_name=admin_last_name,
        email=admin_email,
        role='admin',
        status='active'
    )
    admin_user.set_password(admin_password)
    db.session.add(admin_user)
    db.session.flush()

    slug_base = 'admin'
    slug = slug_base
    suffix = 1
    while Profile.query.filter_by(public_slug=slug).first():
        suffix += 1
        slug = f'{slug_base}-{suffix}'

    profile = Profile(
        user_id=admin_user.id,
        public_slug=slug
    )
    db.session.add(profile)
    db.session.commit()

    print(f"[INFO] Seeded default admin account: {admin_email}")


def seed_default_company():
    """Create a starter company for the default admin on fresh SQLite databases."""
    from .models import Company, CompanyPolicy, User

    admin_user = User.query.filter_by(role='admin').first()
    if not admin_user:
        return

    existing_company = Company.query.filter_by(admin_user_id=admin_user.id).first()
    if existing_company:
        if not admin_user.company_id:
            admin_user.company_id = existing_company.id
            db.session.commit()
        return

    company_name = os.getenv('DEFAULT_COMPANY_NAME', 'NexTap Demo Company')
    slug_base = os.getenv('DEFAULT_COMPANY_SLUG', 'nextap-demo')
    slug = slug_base
    suffix = 1
    while Company.query.filter_by(slug=slug).first():
        suffix += 1
        slug = f'{slug_base}-{suffix}'

    company = Company(
        name=company_name,
        slug=slug,
        primary_color=os.getenv('DEFAULT_COMPANY_PRIMARY_COLOR', '#111827'),
        accent_color=os.getenv('DEFAULT_COMPANY_ACCENT_COLOR', '#22C55E'),
        plan='starter',
        status='active',
        admin_user_id=admin_user.id,
    )
    db.session.add(company)
    db.session.flush()

    policy = CompanyPolicy(
        company_id=company.id,
        required_fields=['title', 'photo_url'],
        editable_fields=['title', 'bio', 'phone', 'whatsapp', 'email_public', 'website', 'location', 'photo_url'],
        approval_required=False,
        auto_approve=True,
    )
    db.session.add(policy)

    admin_user.company_id = company.id
    db.session.commit()

    print(f"[INFO] Seeded default company: {company.name} ({company.slug})")


def ensure_profile_schema():
    """Add newly introduced profile columns for existing SQLite databases."""
    from sqlalchemy import text

    if not _is_sqlite_database():
        return

    existing_columns = {
        row[1]
        for row in db.session.execute(text("PRAGMA table_info(profile)"))
    }

    column_definitions = {
        'linkedin_url': 'ALTER TABLE profile ADD COLUMN linkedin_url VARCHAR(512)',
        'twitter_url': 'ALTER TABLE profile ADD COLUMN twitter_url VARCHAR(512)',
        'instagram_url': 'ALTER TABLE profile ADD COLUMN instagram_url VARCHAR(512)',
        'cover_color': 'ALTER TABLE profile ADD COLUMN cover_color VARCHAR(32)',
        'button_style': 'ALTER TABLE profile ADD COLUMN button_style VARCHAR(32)',
        'font_style': 'ALTER TABLE profile ADD COLUMN font_style VARCHAR(32)',
        'background_image_url': 'ALTER TABLE profile ADD COLUMN background_image_url TEXT',
        'background_overlay_opacity': 'ALTER TABLE profile ADD COLUMN background_overlay_opacity INTEGER DEFAULT 20',
        'background_blur_strength': 'ALTER TABLE profile ADD COLUMN background_blur_strength INTEGER DEFAULT 0',
        'section_order': 'ALTER TABLE profile ADD COLUMN section_order TEXT',
        'layout_mode': "ALTER TABLE profile ADD COLUMN layout_mode VARCHAR(16) DEFAULT 'stack'",
        'section_positions': 'ALTER TABLE profile ADD COLUMN section_positions TEXT',
        'social_links_json': 'ALTER TABLE profile ADD COLUMN social_links_json TEXT',
        'contact_action_order': 'ALTER TABLE profile ADD COLUMN contact_action_order TEXT',
        'enabled_contact_actions': 'ALTER TABLE profile ADD COLUMN enabled_contact_actions TEXT',
        'name_size': 'ALTER TABLE profile ADD COLUMN name_size INTEGER DEFAULT 16',
        'title_size': 'ALTER TABLE profile ADD COLUMN title_size INTEGER DEFAULT 12',
        'bio_size': 'ALTER TABLE profile ADD COLUMN bio_size INTEGER DEFAULT 12',
        'photo_size': 'ALTER TABLE profile ADD COLUMN photo_size INTEGER DEFAULT 80',
        'photo_offset_y': 'ALTER TABLE profile ADD COLUMN photo_offset_y INTEGER DEFAULT 0',
        'name_bold': 'ALTER TABLE profile ADD COLUMN name_bold BOOLEAN DEFAULT 1',
        'title_bold': 'ALTER TABLE profile ADD COLUMN title_bold BOOLEAN DEFAULT 0',
        'bio_bold': 'ALTER TABLE profile ADD COLUMN bio_bold BOOLEAN DEFAULT 0',
        'body_background_color': 'ALTER TABLE profile ADD COLUMN body_background_color VARCHAR(32)',
        'body_text_color': 'ALTER TABLE profile ADD COLUMN body_text_color VARCHAR(32)',
        'body_background_image_url': 'ALTER TABLE profile ADD COLUMN body_background_image_url TEXT',
        'action_hover_color': 'ALTER TABLE profile ADD COLUMN action_hover_color VARCHAR(32)',
        'show_exchange_contact': 'ALTER TABLE profile ADD COLUMN show_exchange_contact BOOLEAN DEFAULT 1',
    }

    for column_name, ddl in column_definitions.items():
        if column_name not in existing_columns:
            db.session.execute(text(ddl))

    db.session.commit()


def _generate_short_card_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def ensure_card_schema():
    """Add card short code column and backfill values for existing records."""
    from sqlalchemy import text
    from .models import Card

    if not _is_sqlite_database():
        return

    existing_columns = {
        row[1]
        for row in db.session.execute(text("PRAGMA table_info(card)"))
    }

    if 'short_code' not in existing_columns:
        db.session.execute(text('ALTER TABLE card ADD COLUMN short_code VARCHAR(16)'))
        db.session.commit()

    cards = Card.query.all()
    existing_codes = {card.short_code for card in cards if card.short_code}

    for card in cards:
        if card.short_code:
            continue

        candidate = _generate_short_card_code(6)
        while candidate in existing_codes:
            candidate = _generate_short_card_code(6)

        card.short_code = candidate
        existing_codes.add(candidate)

    db.session.commit()


def ensure_shared_contact_schema():
    """Create shared_contact table columns for existing SQLite databases."""
    if not _is_sqlite_database():
        return
    from .models import SharedContact  # noqa: F401 — ensures table is registered
    db.create_all()


def ensure_card_design_schema():
    """Create card_design table for existing SQLite databases."""
    if not _is_sqlite_database():
        return
    from .models import CardDesign  # noqa: F401 — ensures table is registered
    db.create_all()


def register_blueprints(app):
    """Register all route blueprints"""
    from .routes import auth, profile, card, company, employee, invitation, department, analytics, admin, design
    
    # Register API blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(profile.bp)
    app.register_blueprint(card.bp)
    app.register_blueprint(company.bp)
    app.register_blueprint(employee.bp)
    app.register_blueprint(invitation.bp)
    app.register_blueprint(department.bp)
    app.register_blueprint(analytics.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(design.bp)


def register_error_handlers(app):
    """Register error handlers"""
    from flask import request
    
    @app.errorhandler(404)
    def not_found(error):
        # For API paths, return proper API 404 error
        if request.path.startswith('/api/'):
            return {
                'error': 'Not Found',
                'message': 'The requested resource was not found'
            }, 404
        
        # For non-API paths, serve frontend files or index.html for SPA routing
        frontend_dist_dir = os.getenv(
            'FRONTEND_DIST_DIR',
            os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dist'))
        )
        
        # Try to serve static file
        candidate = os.path.join(frontend_dist_dir, request.path.lstrip('/'))
        if os.path.isfile(candidate):
            return send_from_directory(frontend_dist_dir, request.path.lstrip('/'))
        
        # Serve index.html for SPA routing
        index_path = os.path.join(frontend_dist_dir, 'index.html')
        if os.path.isfile(index_path):
            return send_from_directory(frontend_dist_dir, 'index.html')

        return {
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }, 404
    
    @app.errorhandler(403)
    def forbidden(error):
        return {
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }, 403
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }, 500


def register_cli_commands(app):
    """Register Flask CLI commands"""
    
    @app.cli.command()
    def init_db():
        """Initialize the database"""
        db.create_all()
        print('Database initialized')
    

