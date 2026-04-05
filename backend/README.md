# NexTap Backend - Flask API

Professional Python Flask backend for the NexTap NFC digital business card SaaS platform with B2B company workspace management.

## Architecture

```
backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── config.py             # Configuration management
│   ├── extensions.py         # Flask extensions (db, jwt, cors, etc)
│   ├── models/               # SQLAlchemy ORM models
│   │   └── __init__.py       # All database models
│   ├── routes/               # API blueprints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── profile.py       # User profile management
│   │   ├── card.py          # NFC card operations
│   │   ├── company.py       # Company workspace
│   │   ├── employee.py      # Employee management
│   │   ├── invitation.py    # Employee invitations
│   │   ├── department.py    # Department management
│   │   ├── analytics.py     # Analytics and tracking
│   │   └── admin.py         # Admin operations
│   ├── services/             # Business logic services (future)
│   ├── schemas/              # Request validation schemas (future)
│   └── utils/
│       └── auth.py           # Authentication utilities
├── migrations/               # Alembic database migrations
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
├── run.py                   # Application entry point
└── README.md                # This file
```

## Database Models

### Core Entities

**User**
- Authentication and role management
- Company membership
- Profile association
- Roles: admin, company_admin, employee

**Profile**
- Public profile with slug
- Profile fields and completion tracking
- Approval workflow
- Company branding support

**Company**
- Workspace/organization
- Subscription management
- Branding configuration
- Policy enforcement

**Department**
- Organization within company
- Employee grouping

**Card**
- NFC card representation
- Assignment and claiming workflow
- Status tracking
- Analytics associations

**Invitation**
- Employee onboarding
- Token-based acceptance
- Card assignment
- Expiration management

**CompanyPolicy**
- Field requirements and editability
- Approval workflows
- Branding controls

**AnalyticsEvent**
- Card taps and profile views
- Device and browser tracking
- Referrer tracking
- Timestamp recording

**AuditLog**
- Action tracking
- Compliance logging
- Change history

## API Endpoints

### Authentication
```
POST   /api/auth/register              # Create new account
POST   /api/auth/login                 # Login
GET    /api/auth/me                    # Get current user
POST   /api/auth/logout                # Logout
POST   /api/auth/invitation/:token/accept  # Accept invitation
```

### Profiles
```
GET    /api/profile/:slug              # Get public profile
GET    /api/profile/me                 # Get my profile
PUT    /api/profile/me/update          # Update profile
POST   /api/profile/:id/approve        # Approve profile
POST   /api/profile/:id/reject         # Reject profile
```

### Cards
```
GET    /api/card/:code                 # Get card by code (public)
POST   /api/card/claim                 # Claim card
POST   /api/card/:id/assign            # Assign to user
POST   /api/card/:id/reassign          # Reassign to different user
PATCH  /api/card/:id/status            # Update card status
```

### Company
```
POST   /api/company/create             # Create company (admin)
GET    /api/company/:id                # Get company
PUT    /api/company/:id/update         # Update company
GET    /api/company/:id/policy         # Get company policy
PUT    /api/company/:id/policy         # Update policy
GET    /api/company/:id/members        # List employees
GET    /api/company/:id/stats          # Get statistics
```

### Employees
```
GET    /api/company/:id/employees                  # List employees
GET    /api/company/:id/employees/:id              # Get employee details
PATCH  /api/company/:id/employees/:id/update       # Update employee
DELETE /api/company/:id/employees/:id/remove       # Remove employee
```

### Invitations
```
POST   /api/company/:id/invitations/send           # Send invitation
GET    /api/company/:id/invitations                # List invitations
POST   /api/company/:id/invitations/:id/resend     # Resend invitation
POST   /api/company/:id/invitations/:id/revoke     # Revoke invitation
```

### Departments
```
GET    /api/company/:id/departments                # List departments
POST   /api/company/:id/departments/create         # Create department
GET    /api/company/:id/departments/:id            # Get department
PATCH  /api/company/:id/departments/:id/update     # Update department
DELETE /api/company/:id/departments/:id/delete     # Delete department
```

### Analytics
```
GET    /api/analytics/company/:id              # Company analytics
GET    /api/analytics/user/:id                 # User analytics
GET    /api/analytics/card/:id                 # Card analytics
```

### Admin
```
GET    /api/admin/companies            # List all companies
GET    /api/admin/users                # List all users
GET    /api/admin/cards                # List all cards
GET    /api/admin/audit-logs           # Get audit logs
GET    /api/admin/stats                # System statistics
```

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- pip or Poetry

### Installation

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate      # On Unix
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:** 
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database:**
```bash
flask db upgrade
```

6. **Seed sample data (optional):**
```bash
flask seed-db
```

### Running

**Development:**
```bash
python run.py
```

Visit: `http://localhost:5000`

**Production:**
```bash
FLASK_ENV=production PORT=8000 gunicorn "app:create_app()"
```

## Authentication

Uses JWT tokens (Flask-JWT-Extended):

**Token Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

## Role-Based Access Control

- **admin**: Full system access
- **company_admin**: Full company management
- **employee**: Own profile and company data only

## Error Handling

Standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `500`: Server error

Error response format:
```json
{
  "error": "Error type",
  "message": "Detailed message"
}
```

## Database Migrations

Using Flask-Migrate/Alembic:

```bash
# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade

# Downgrade
flask db downgrade
```

## Security

- Passwords hashed with bcrypt
- JWT token expiration (1 hour access, 30 days refresh)
- CORS configured for frontend origins
- Role-based access control on all endpoints
- Audit logging for compliance

## Future Enhancements

- Email notifications (invitations, approvals)
- S3 image uploading
- Advanced analytics dashboards
- API key authentication
- Webhook events
- Rate limiting
- Batch operations

## License

Proprietary - NexTap SaaS Platform
