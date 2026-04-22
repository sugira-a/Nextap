from datetime import datetime
from ..extensions import db
import uuid
import secrets
from werkzeug.security import generate_password_hash, check_password_hash


def generate_uuid():
    """Generate a UUID for model IDs"""
    return str(uuid.uuid4())


# Association table for company-department relationship
company_user = db.Table(
    'company_user',
    db.Column('user_id', db.String(36), db.ForeignKey('user.id'), primary_key=True),
    db.Column('company_id', db.String(36), db.ForeignKey('company.id'), primary_key=True)
)


class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'user'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role: admin, company_admin, employee
    role = db.Column(db.String(50), default='employee', nullable=False)
    
    # Company and department relationships
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'))
    department_id = db.Column(db.String(36), db.ForeignKey('department.id'))
    
    # Status: active, inactive, suspended
    status = db.Column(db.String(50), default='active', nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    company = db.relationship('Company', backref='users', foreign_keys=[company_id])
    department = db.relationship('Department', backref='users')
    cards = db.relationship('Card', backref='assigned_user')
    analytics_events = db.relationship('AnalyticsEvent', backref='user')
    audit_logs_created = db.relationship('AuditLog', backref='actor', foreign_keys='AuditLog.actor_user_id')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Serialize user to dictionary"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'role': self.role,
            'company_id': self.company_id,
            'department_id': self.department_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Profile(db.Model):
    """User profile - extends User with public profile data"""
    __tablename__ = 'profile'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Public profile slug/username
    public_slug = db.Column(db.String(128), unique=True, nullable=False, index=True)
    
    # Profile content
    photo_url = db.Column(db.String(512))
    title = db.Column(db.String(255))
    bio = db.Column(db.Text)
    phone = db.Column(db.String(20))
    whatsapp = db.Column(db.String(20))
    email_public = db.Column(db.String(255))
    website = db.Column(db.String(512))
    location = db.Column(db.String(255))
    linkedin_url = db.Column(db.String(512))
    twitter_url = db.Column(db.String(512))
    instagram_url = db.Column(db.String(512))
    cover_color = db.Column(db.String(32))
    button_style = db.Column(db.String(32))
    font_style = db.Column(db.String(32))
    background_image_url = db.Column(db.Text)
    background_overlay_opacity = db.Column(db.Integer, default=20)
    background_blur_strength = db.Column(db.Integer, default=0)
    section_order = db.Column(db.Text)
    layout_mode = db.Column(db.String(16), default='stack')
    section_positions = db.Column(db.Text)
    social_links_json = db.Column(db.Text)
    contact_action_order = db.Column(db.Text)
    enabled_contact_actions = db.Column(db.Text)
    name_size = db.Column(db.Integer, default=16)
    title_size = db.Column(db.Integer, default=12)
    bio_size = db.Column(db.Integer, default=12)
    photo_size = db.Column(db.Integer, default=80)
    photo_offset_y = db.Column(db.Integer, default=0)
    name_bold = db.Column(db.Boolean, default=True)
    title_bold = db.Column(db.Boolean, default=False)
    bio_bold = db.Column(db.Boolean, default=False)
    body_background_color = db.Column(db.String(32))
    body_text_color = db.Column(db.String(32))
    body_background_image_url = db.Column(db.Text)
    action_hover_color = db.Column(db.String(32))
    show_exchange_contact = db.Column(db.Boolean, default=True)
    
    # Company branding fields
    company_logo_url = db.Column(db.String(512))
    company_brand_color = db.Column(db.String(7))  # hex color
    
    # Status: draft, pending_approval, approved
    approval_status = db.Column(db.String(50), default='draft')
    completion_status = db.Column(db.Integer, default=0)  # percentage
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    analytics_events = db.relationship('AnalyticsEvent', backref='profile')
    shared_contacts = db.relationship('SharedContact', backref='profile', cascade='all, delete-orphan')
    card_designs = db.relationship('CardDesign', backref='profile', cascade='all, delete-orphan', order_by='CardDesign.created_at')
    
    def to_dict(self, include_sensitive=False):
        """Serialize profile to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id if include_sensitive else None,
            'public_slug': self.public_slug,
            'photo_url': self.photo_url,
            'title': self.title,
            'bio': self.bio,
            'phone': self.phone,
            'whatsapp': self.whatsapp,
            'email_public': self.email_public,
            'website': self.website,
            'location': self.location,
            'linkedin_url': self.linkedin_url,
            'twitter_url': self.twitter_url,
            'instagram_url': self.instagram_url,
            'cover_color': self.cover_color,
            'button_style': self.button_style,
            'font_style': self.font_style,
            'background_image_url': self.background_image_url,
            'background_overlay_opacity': self.background_overlay_opacity,
            'background_blur_strength': self.background_blur_strength,
            'section_order': self.section_order,
            'layout_mode': self.layout_mode,
            'section_positions': self.section_positions,
            'social_links_json': self.social_links_json,
            'contact_action_order': self.contact_action_order,
            'enabled_contact_actions': self.enabled_contact_actions,
            'name_size': self.name_size,
            'title_size': self.title_size,
            'bio_size': self.bio_size,
            'photo_size': self.photo_size,
            'photo_offset_y': self.photo_offset_y,
            'name_bold': self.name_bold,
            'title_bold': self.title_bold,
            'bio_bold': self.bio_bold,
            'body_background_color': self.body_background_color,
            'body_text_color': self.body_text_color,
            'body_background_image_url': self.body_background_image_url,
            'action_hover_color': self.action_hover_color,
            'show_exchange_contact': self.show_exchange_contact,
            'company_logo_url': self.company_logo_url,
            'company_brand_color': self.company_brand_color,
            'approval_status': self.approval_status,
            'completion_status': self.completion_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_sensitive:
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
        return data


class Company(db.Model):
    """Company workspace"""
    __tablename__ = 'company'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(128), unique=True, nullable=False, index=True)
    
    # Branding
    logo_url = db.Column(db.String(512))
    primary_color = db.Column(db.String(7), default='#000000')  # hex color
    accent_color = db.Column(db.String(7), default='#22C55E')   # green
    
    # Plan and status
    plan = db.Column(db.String(50), default='starter')  # starter, professional, enterprise
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
    
    # Subscription
    subscription_seats = db.Column(db.Integer, default=5)
    
    # Admin contact
    admin_user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    departments = db.relationship('Department', backref='company', cascade='all, delete-orphan')
    cards = db.relationship('Card', backref='company')
    invitations = db.relationship('Invitation', backref='company', cascade='all, delete-orphan')
    policies = db.relationship('CompanyPolicy', backref='company', uselist=False, cascade='all, delete-orphan')
    analytics_events = db.relationship('AnalyticsEvent', backref='company')
    
    def to_dict(self):
        """Serialize company to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'logo_url': self.logo_url,
            'primary_color': self.primary_color,
            'accent_color': self.accent_color,
            'plan': self.plan,
            'status': self.status,
            'subscription_seats': self.subscription_seats,
            'admin_user_id': self.admin_user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Department(db.Model):
    """Department within a company"""
    __tablename__ = 'department'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('company_id', 'name', name='uq_company_department_name'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Card(db.Model):
    """NFC Card - the core product"""
    __tablename__ = 'card'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    code = db.Column(db.String(128), unique=True, nullable=False, index=True)  # NFC code
    short_code = db.Column(db.String(16), unique=True, nullable=False, index=True)
    
    # Company assignment
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'), nullable=False)
    
    # User assignment
    assigned_user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    
    # Status: unassigned, assigned, active, suspended, retired
    status = db.Column(db.String(50), default='unassigned')
    
    # Claim status: whether this card has been claimed
    claim_status = db.Column(db.Boolean, default=False)
    
    # Metadata
    serial_number = db.Column(db.String(128))
    hardware_version = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    assigned_at = db.Column(db.DateTime)
    claimed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    analytics_events = db.relationship('AnalyticsEvent', backref='card')
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'short_code': self.short_code,
            'landing_path': f"/card/{self.short_code}",
            'company_id': self.company_id,
            'assigned_user_id': self.assigned_user_id,
            'status': self.status,
            'claim_status': self.claim_status,
            'serial_number': self.serial_number,
            'hardware_version': self.hardware_version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'claimed_at': self.claimed_at.isoformat() if self.claimed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Invitation(db.Model):
    """Employee invitation"""
    __tablename__ = 'invitation'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    
    # Role for invited user
    role = db.Column(db.String(50), default='employee')
    
    # Optional card assignment
    assigned_card_id = db.Column(db.String(36), db.ForeignKey('card.id'))
    
    # Invitation token and expiry
    token = db.Column(db.String(255), unique=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    
    # Status: pending, accepted, expired, revoked
    status = db.Column(db.String(50), default='pending')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    accepted_at = db.Column(db.DateTime)
    
    # Who invited
    invited_by_user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    
    def is_expired(self):
        """Check if invitation has expired"""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'email': self.email,
            'role': self.role,
            'assigned_card_id': self.assigned_card_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
        }


class CompanyPolicy(db.Model):
    """Company rules for profile fields"""
    __tablename__ = 'company_policy'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'), unique=True, nullable=False)
    
    # JSON arrays of required and editable fields
    required_fields = db.Column(db.JSON, default=list)  # ['title', 'photo_url', 'bio']
    editable_fields = db.Column(db.JSON, default=list)  # all fields that can be edited
    
    # Approval settings
    approval_required = db.Column(db.Boolean, default=False)
    auto_approve = db.Column(db.Boolean, default=True)
    
    # Branding control
    allow_custom_branding = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'required_fields': self.required_fields,
            'editable_fields': self.editable_fields,
            'approval_required': self.approval_required,
            'auto_approve': self.auto_approve,
            'allow_custom_branding': self.allow_custom_branding,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AnalyticsEvent(db.Model):
    """Analytics tracking for card taps and profile views"""
    __tablename__ = 'analytics_event'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    
    # References
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    profile_id = db.Column(db.String(36), db.ForeignKey('profile.id'))
    card_id = db.Column(db.String(36), db.ForeignKey('card.id'), nullable=False)
    company_id = db.Column(db.String(36), db.ForeignKey('company.id'))
    
    # Event data
    event_type = db.Column(db.String(50), nullable=False)  # tap, view, download, social_click
    
    # Device information
    device_type = db.Column(db.String(50))  # mobile, desktop, tablet
    browser = db.Column(db.String(128))
    os = db.Column(db.String(128))
    
    # Additional data
    referrer = db.Column(db.String(512))
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    user_agent = db.Column(db.Text)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class AuditLog(db.Model):
    """Audit trail for compliance and debugging"""
    __tablename__ = 'audit_log'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    
    # Who performed the action
    actor_user_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    
    # What action
    action = db.Column(db.String(255), nullable=False)  # create_user, invite_employee, assign_card, etc
    
    # What was affected
    target_type = db.Column(db.String(50), nullable=False)  # user, card, company, invitation, profile
    target_id = db.Column(db.String(36), nullable=False)
    
    # Additional context
    changes = db.Column(db.JSON)  # before/after values
    ip_address = db.Column(db.String(45))
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'changes': self.changes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class SharedContact(db.Model):
    """Contact info shared by a visitor on a user's public profile page"""
    __tablename__ = 'shared_contact'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    profile_id = db.Column(db.String(36), db.ForeignKey('profile.id'), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50))
    email = db.Column(db.String(255))
    company = db.Column(db.String(255))
    note = db.Column(db.Text)

    is_read = db.Column(db.Boolean, default=False, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'company': self.company,
            'note': self.note,
            'is_read': self.is_read,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
        }


class CardDesign(db.Model):
    """NFC card design saved from Profile Studio"""
    __tablename__ = 'card_design'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    profile_id = db.Column(db.String(36), db.ForeignKey('profile.id'), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False, default='My Design')
    elements_json = db.Column(db.Text, nullable=False, default='[]')
    bg_json = db.Column(db.Text, nullable=False, default='{}')
    template_id = db.Column(db.String(64))
    is_active = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'name': self.name,
            'elements': json.loads(self.elements_json or '[]'),
            'bg': json.loads(self.bg_json or '{}'),
            'template_id': self.template_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
