# NexTap B2B SaaS Platform - Complete System Architecture

## Overview

NexTap is a professional NFC digital business card SaaS platform with B2B company workspace management. The system is built with a modern React frontend (Vite + TypeScript) and a production-ready Python Flask backend with PostgreSQL.

## System Components

### 1. Frontend (React + Vite + TailwindCSS)
**Location:** `/src`

#### Core Pages

**Public Routes:**
- **LandingPage** (`/`) - Marketing homepage
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user signup
- **ForgotPassword** (`/forgot-password`) - Password recovery
- **PublicProfile** (`/u/:username`) - Public profile view
- **CardRoute** (`/card/:code`) - NFC card activation/redirect

**Employee Dashboard** (`/dashboard`)
- **DashboardOverview** - Personal statistics & quick actions
- **EditProfile** - Manage personal profile information
- **MyCard** - View and share personal NFC card
- **Analytics** - Views and engagement metrics
- **Appearance** - Profile customization
- **Links** - Social/business links management
- **Settings** - Account & privacy settings

**Company Workspace** (`/company`)
- **CompanyLayout** - Main layout with sidebar navigation
- **CompanyOverview** - Dashboard with stats and activity charts
- **EmployeeManagement** - Searchable employee table with actions
- **CardManagement** - Inventory management and card status
- **InvitationManagement** - Employee invitations with token tracking
- **CompanySettings** - Branding, policies, and configuration
- **CompanyAnalytics** - Comprehensive usage analytics

**Admin Dashboard** (`/admin`)
- **AdminOverview** - System statistics
- **AdminCards** - Card inventory management
- **AdminUsers** - User management

#### Design System
- **Colors:** Black (#000000), White (#FFFFFF), Accent Green (#22C55E)
- **Typography:** Premium sans-serif with strong hierarchy
- **Components:** shadcn/ui + custom components
- **State Management:** React hooks + React Query
- **Animations:** Framer Motion for smooth transitions
- **Icons:** Lucide React

### 2. Backend (Python Flask)
**Location:** `/backend`

#### Architecture
```
app/
├── __init__.py           # Flask app factory
├── config.py             # Configuration (dev, test, prod)
├── extensions.py         # Flask extensions initialization
├── models/
│   └── __init__.py       # SQLAlchemy ORM models
├── routes/
│   ├── auth.py          # Authentication endpoints
│   ├── profile.py       # Profile management
│   ├── card.py          # Card operations
│   ├── company.py       # Company management
│   ├── employee.py      # Employee operations
│   ├── invitation.py    # Invitation system
│   ├── department.py    # Department management
│   ├── analytics.py     # Analytics endpoints
│   └── admin.py         # Admin operations
├── services/            # Business logic (extensible)
├── schemas/             # Request validation (extensible)
└── utils/
    └── auth.py          # Auth utilities & decorators
```

#### Key Features

**Authentication**
- JWT token-based (access + refresh)
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Token expiration: 1 hour (access), 30 days (refresh)

**Database Models**

1. **User** - Core user entity
   - Authentication credentials
   - Role assignment (admin, company_admin, employee)
   - Company/department membership
   - Status tracking

2. **Profile** - Public user profile
   - Public slug for URL
   - Profile completion status
   - Approval workflow state
   - Company branding fields

3. **Company** - Organization workspace
   - Branding configuration
   - Subscription management
   - Policy enforcement
   - Admin user designation

4. **Department** - Organization within company
   - Employee grouping
   - Company-specific structure

5. **Card** - NFC card entity
   - Unique code identifier
   - Assignment and claiming workflow
   - Status management
   - Hardware metadata

6. **Invitation** - Employee onboarding
   - Email-based invitation system
   - Secure token generation
   - Expiration tracking
   - Role assignment
   - Card pre-assignment

7. **CompanyPolicy** - Governance rules
   - Required profile fields
   - Editable field restrictions
   - Approval workflows
   - Branding controls

8. **AnalyticsEvent** - Event tracking
   - Card taps and profile views
   - Device/browser detection
   - Referrer tracking
   - Time-series data

9. **AuditLog** - Compliance logging
   - Action tracking
   - Change history
   - IP logging
   - Actor identification

#### API Endpoints

**Authentication** (10 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/invitation/:token/accept
```

**Profiles** (5 endpoints)
```
GET    /api/profile/:slug
GET    /api/profile/me
PUT    /api/profile/me/update
POST   /api/profile/:id/approve
POST   /api/profile/:id/reject
```

**Cards** (5 endpoints)
```
GET    /api/card/:code
POST   /api/card/claim
POST   /api/card/:id/assign
POST   /api/card/:id/reassign
PATCH  /api/card/:id/status
```

**Company** (7 endpoints)
```
POST   /api/company/create
GET    /api/company/:id
PUT    /api/company/:id/update
GET    /api/company/:id/policy
PUT    /api/company/:id/policy
GET    /api/company/:id/members
GET    /api/company/:id/stats
```

**Employees** (4 endpoints)
```
GET    /api/company/:id/employees
GET    /api/company/:id/employees/:id
PATCH  /api/company/:id/employees/:id/update
DELETE /api/company/:id/employees/:id/remove
```

**Invitations** (4 endpoints)
```
POST   /api/company/:id/invitations/send
GET    /api/company/:id/invitations
POST   /api/company/:id/invitations/:id/resend
POST   /api/company/:id/invitations/:id/revoke
```

**Departments** (5 endpoints)
```
GET    /api/company/:id/departments
POST   /api/company/:id/departments/create
GET    /api/company/:id/departments/:id
PATCH  /api/company/:id/departments/:id/update
DELETE /api/company/:id/departments/:id/delete
```

**Analytics** (3 endpoints)
```
GET    /api/analytics/company/:id
GET    /api/analytics/user/:id
GET    /api/analytics/card/:id
```

**Admin** (5 endpoints)
```
GET    /api/admin/companies
GET    /api/admin/users
GET    /api/admin/cards
GET    /api/admin/audit-logs
GET    /api/admin/stats
```

**Total: 46 API endpoints**

## Business Logic

### Card Lifecycle

1. **Creation & Unassigned**
   - Card code generated (unique identifier)
   - Status: `unassigned`
   - Storage in inventory

2. **Assignment**
   - Admin assigns card to employee
   - Card code sent to employee
   - Status: `assigned` (not yet claimed)

3. **Claiming**
   - Employee visits `/card/:code`
   - User is authenticated
   - Card linked to user profile
   - Status: `active`
   - `claim_status` = true

4. **Public Access**
   - Card tap/scan redirects to `/u/:username`
   - Public profile displayed
   - Analytics event recorded

5. **Management**
   - Suspension, reassignment, retirement possible
   - Admin can reassign to different user
   - Claim and assignment separate concerns

### Employee Onboarding

1. **Invitation**
   ```
   Admin → Invites employee email
   System → Generates secure token
   System → Sets 7-day expiration
   ```

2. **Acceptance**
   ```
   Employee → Clicks invitation link
   System → Validates token & expiration
   System → Creates user account
   System → Assigns pre-selected card (if any)
   System → Marks invitation accepted
   ```

3. **Profile Setup**
   ```
   Employee → Completes profile under company rules
   System → Validates against CompanyPolicy
   System → Tracks completion %
   System → Submission for approval (if required)
   ```

4. **Active**
   ```
   Employee → Profile approved & public
   Employee → Card active and claimable
   Analytics → Starting to track engagement
   ```

### Company Policy Enforcement

**Required Fields**
- Company defines minimum profile fields
- Employee cannot publish without these
- Examples: title, photo_url, bio

**Editable Fields**
- Whitelist of fields employees can modify
- Company controls customization level
- Examples: phone, website, location

**Approval Workflow**
- Optional approval requirement
- Admin review before publishing
- Auto-approve option for fast onboarding

**Branding Controls**
- Company colors applied to employee profiles
- Logo branding injection
- Consistent visual identity

## Data Flow Diagrams

### Public Card Access Flow
```
User scans NFC card
    ↓
GET /api/card/:code
    ↓
Card found? Yes → claim_status == true?
    ↓ Yes              ↓ No
Redirect to /u/:slug   Show activation form
    ↓
Track analytics event
```

### Employee Invitation Flow
```
Admin creates invitation
    ↓
Sends secure token to email
    ↓
Employee clicks link
    ↓
POST /api/auth/invitation/:token/accept
    ↓
Token valid? Expiration ok?
    ↓ Yes
Create user account
Add to company
Assign card (if pre-assigned)
    ↓
Employee registers password
    ↓
Dashboard available
```

### Profile Approval Flow
```
Employee edits profile
    ↓
PUT /api/profile/me/update
    ↓
Validate against CompanyPolicy
    ↓
Approval required?
    ↓ Yes              ↓ No
Set to pending          Auto approve if enabled
Notify admin            Set to approved
    ↓
Admin reviews
    ↓
POST /api/profile/:id/approve or reject
    ↓
Update approval_status
```

## Security Architecture

### Authentication & Authorization

**JWT Tokens**
```
Header: Authorization: Bearer <token>
Payload: { identity: user_id }
Expiry: Access (1h), Refresh (30d)
Secret: Unique per environment
```

**Role-Based Access Control**
```
@require_role('admin')              # Admin only
@require_role('company_admin')      # Company admin
@require_company_member()           # Must be in company
@validate_request_json(...)         # Request validation
```

**Password Security**
```
Hash: bcrypt (rounds: 12)
Never: Plaintext storage
Always: Secure comparison
```

### Audit & Compliance

**Audit Logging**
- All admin actions recorded
- Change tracking (before/after)
- IP address logging
- Timestamp precision

**Data Privacy**
- Sensitive fields protected
- Role-based field exposure
- CORS origin validation
- User data isolation

## Deployment

### Frontend
```
npm install
npm run build
npm run dev          # Development
npm run preview      # Production preview
```

### Backend
```
pip install -r requirements.txt
python run.py                    # Development (port 5000)
gunicorn "app:create_app()" -b 0.0.0.0:8000  # Production
```

### Environment Variables

**Frontend:**
```
VITE_API_URL=http://localhost:5000
```

**Backend:**
```
FLASK_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/nextap_db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-key
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

## Performance Considerations

### Frontend Optimization
- Code splitting via Vite
- Image optimization
- Lazy loading routes
- Component memoization
- Query caching with React Query

### Backend Optimization
- Database indexing on:
  - `card.code` (UNIQUE)
  - `profile.public_slug` (UNIQUE)
  - `company.slug` (UNIQUE)
  - Timestamps for analytics
- Query pagination (default 20 items)
- Analytics event batching (future)
- Cache layer (future)

### Database Indices
```
User: email, company_id, role, status
Profile: public_slug, user_id, approval_status
Company: slug, status
Card: code, company_id, assigned_user_id, claim_status
Invitation: token, company_id, email, status
AnalyticsEvent: card_id, user_id, timestamp, event_type
```

## Testing Strategy

### Backend Tests (Recommended)
- Unit tests for models & services
- Integration tests for API endpoints
- Auth & permission tests
- Analytics aggregation tests

### Frontend Tests (Recommended)
- Component unit tests
- Integration tests for flows
- API mocking with MSW
- Accessibility tests

## Future Enhancements

### Phase 2
- Email notifications (invitations, approvals)
- S3 image uploads
- Advanced analytics dashboards
- Batch CSV operations
- API rate limiting

### Phase 3
- Webhooks for integrations
- SSO integration (OAuth2)
- API key authentication
- Custom branding domains
- Data export features

### Phase 4
- Machine learning for analytics
- Predictive insights
- Advanced segmentation
- Customizable workflows
- Multi-language support

## Documentation
- Backend API: `/backend/README.md`
- Frontend: See component files
- Database: Schema in models
- Deployment: `docker-compose.yml` (future)

---

**Version:** 1.0 (B2B Launch)
**Last Updated:** April 2026
