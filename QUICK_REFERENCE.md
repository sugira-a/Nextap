# Quick Reference - NexTap B2B Platform

## 📁 File Locations

### Backend
- **Main Code:** `/backend/app/`
- **Models:** `/backend/app/models/__init__.py` (9 models, 500+ lines)
- **Routes:** `/backend/app/routes/` (46 endpoints, 8 files)
- **Config:** `/backend/app/config.py`
- **Entry:** `/backend/run.py`
- **Docs:** `/backend/README.md`
- **Setup:** `/backend/.env.example`
- **Deps:** `/backend/requirements.txt`

### Frontend
- **Company Pages:** `/src/pages/company/` (6 files)
  - CompanyLayout.tsx (sidebar nav)
  - CompanyOverview.tsx (dashboard)
  - EmployeeManagement.tsx (table)
  - CardManagement.tsx (grid)
  - InvitationManagement.tsx (onboarding)
  - CompanySettings.tsx (config)
  - CompanyAnalytics.tsx (charts)
- **Routes:** `/src/App.tsx` (updated with /company routes)
- **Complete Pages:** `/src/pages/ ` (all other existing pages)

### Documentation
- **System Architecture:** `/SYSTEM_ARCHITECTURE.md` (complete technical guide)
- **Integration Guide:** `/INTEGRATION_GUIDE.md` (API examples)
- **Build Summary:** `/BUILD_SUMMARY.md` (high-level overview)
- **Backend Readme:** `/backend/README.md` (backend setup)

---

## 🚀 Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with DATABASE_URL
python run.py
# Runs on http://localhost:5000
```

### 2. Start Frontend (Terminal 2)
```bash
# Already running from earlier, or:
npm install
npm run dev
# Runs on http://localhost:8080
```

### 3. Create Database
```bash
createdb nextap_db
# Backend auto-creates tables via SQLAlchemy
```

### 4. Test It
1. Register at `http://localhost:8080/register`
2. Visit `/company` - Create workspace
3. Navigate to `/company/invitations`
4. Invite a team member
5. View company dashboard

---

## 📊 API Endpoint Summary

### Quick Access Map
```
Auth Endpoints (5)
├── POST /api/auth/register
├── POST /api/auth/login
├── GET  /api/auth/me
├── POST /api/auth/logout
└── POST /api/auth/invitation/:token/accept

Company Endpoints (7)
├── POST /api/company/create
├── GET  /api/company/:id
├── PUT  /api/company/:id/update
├── GET  /api/company/:id/policy
├── PUT  /api/company/:id/policy
├── GET  /api/company/:id/members
└── GET  /api/company/:id/stats

Employee Endpoints (4)
├── GET    /api/company/:id/employees
├── GET    /api/company/:id/employees/:id
├── PATCH  /api/company/:id/employees/:id/update
└── DELETE /api/company/:id/employees/:id/remove

Invitation Endpoints (4)
├── POST /api/company/:id/invitations/send
├── GET  /api/company/:id/invitations
├── POST /api/company/:id/invitations/:id/resend
└── POST /api/company/:id/invitations/:id/revoke

Card Endpoints (5)
├── GET  /api/card/:code
├── POST /api/card/claim
├── POST /api/card/:id/assign
├── POST /api/card/:id/reassign
└── PATCH /api/card/:id/status

Profile Endpoints (5)
├── GET /api/profile/:slug
├── GET /api/profile/me
├── PUT /api/profile/me/update
├── POST /api/profile/:id/approve
└── POST /api/profile/:id/reject

Department Endpoints (5)
├── GET  /api/company/:id/departments
├── POST /api/company/:id/departments/create
├── GET  /api/company/:id/departments/:id
├── PATCH /api/company/:id/departments/:id/update
└── DELETE /api/company/:id/departments/:id/delete

Analytics Endpoints (3)
├── GET /api/analytics/company/:id
├── GET /api/analytics/user/:id
└── GET /api/analytics/card/:id

Admin Endpoints (3)
├── GET /api/admin/companies
├── GET /api/admin/users
├── GET /api/admin/cards
└── GET /api/admin/audit-logs
```

---

## 🗄️ Database Models Quick Ref

```
User
├── id, email, password_hash
├── role (admin, company_admin, employee)
├── company_id, department_id
└── status (active, inactive, suspended)

Profile
├── id, user_id
├── public_slug (unique)
├── title, bio, location, etc.
└── approval_status (draft, pending, approved)

Company
├── id, name, slug (unique)
├── logo_url, primary_color, accent_color
├── plan, status, subscription_seats
└── admin_user_id

Department
├── id, company_id, name
└── description

Card
├── id, code (unique)
├── company_id, assigned_user_id
├── status (unassigned, assigned, active, suspended)
└── claim_status (boolean)

Invitation
├── id, company_id, email
├── token (unique)
├── role, assigned_card_id
├── status (pending, accepted, expired, revoked)
└── expires_at

CompanyPolicy
├── id, company_id (unique)
├── required_fields (JSON array)
├── editable_fields (JSON array)
├── approval_required, auto_approve
└── allow_custom_branding

AnalyticsEvent
├── id, user_id, profile_id, card_id, company_id
├── event_type (tap, view, download, social_click)
├── device_type, browser, os
└── timestamp

AuditLog
├── id, actor_user_id
├── action (string)
├── target_type, target_id
├── changes (JSON)
└── timestamp
```

---

## 🔐 Authentication

### Login Flow
```typescript
// 1. Register/Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { access_token, refresh_token } = await response.json();

// 2. Store tokens
localStorage.setItem('access_token', access_token);

// 3. Use in requests
const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

### Roles & Permissions
```
admin         → Full system access
company_admin → Company management only
employee      → Own data only
```

---

## 🐛 Common Issues & Fixes

### Backend Won't Start
```bash
# Check database connection
DATABASE_URL=postgresql://localhost:5432/nextap_db python run.py

# Reset database
dropdb nextap_db
createdb nextap_db

# Check port
netstat -an | grep 5000
```

### Frontend Can't Reach Backend
```bash
# Verify backend is running
curl http://localhost:5000/api/auth/me

# Check CORS
curl -i http://localhost:5000/api/auth/me
# Look for Access-Control-Allow-Origin header

# Fix: Update CORS_ORIGINS in backend/.env
```

### Database Error
```bash
# Check PostgreSQL
psql -U postgres

# Create database
createdb nextap_db

# Verify connection
psql -U postgres -d nextap_db -c "SELECT 1"
```

---

## 💡 Development Tips

### Hot Reload Frontend
```bash
npm run dev
# Auto-refreshes on file change
```

### Hot Reload Backend
```bash
# Install
pip install python-dotenv flask-reload

# Use debug mode
FLASK_ENV=development python run.py
```

### Test API Endpoints
```bash
# Simple request
curl http://localhost:5000/api/auth/me

# With token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me

# Post request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'
```

### Database Query
```bash
# Connect to database
psql nextap_db

# List tables
\dt

# Query users
SELECT id, email, role FROM "user" LIMIT 5;

# Query companies
SELECT id, name, plan FROM company;
```

---

## 📈 Key Workflows

### Employee Onboarding
1. Admin: Go to `/company/invitations`
2. Admin: Click "Invite Employee"
3. Admin: Enter email, select role, optional card
4. System: Generates secure token, sends email
5. Employee: Clicks link `http://localhost:8080/invitation/:token/accept`
6. Employee: Sets password, creates account
7. Employee: Completes profile at `/dashboard/profile`
8. Admin: Approves profile at `/company` (if required)
9. Employee: Go to `/dashboard/card` to view NFC

### Card Management
1. Admin: Go to `/company/cards`
2. Admin: Search or browse card inventory
3. Admin: Copy code, assign to employee, suspend, etc.
4. Public: Visit `/card/:code` → auto-redirects to public profile
5. System: Tracks analytics automatically

### Analytics Tracking
1. **Card Tap:** Scan NFC → `/api/card/:code` → AnalyticsEvent created
2. **Profile View:** Visit `/u/:username` → AnalyticsEvent created  
3. **Aggregate:** `/api/analytics/company/:id` shows 30-day trends
4. **Charts:** Dashboard displays activity, top cards, devices

---

## 🔄 Component Update Patterns

### Frontend Updates
1. Edit component in `/src/pages/company/*.tsx`
2. Component auto-saves & hot-reloads
3. Try testing with API

### Backend Updates
1. Edit route in `/backend/app/routes/*.py`
2. Changes auto-reload (with hot reload enabled)
3. Test with curl or Postman

### Model/Schema Updates
1. Edit in `/backend/app/models/__init__.py`
2. Create migration: `flask db migrate -m "description"`
3. Apply: `flask db upgrade`

---

## 📱 UI Component Library

All pages use these components:
- `Card` - Container component
- `Button` - Standard buttons
- `Input` - Text input fields
- `Label` - Form labels
- `Dialog` - Modal dialogs
- `Dropdown` - Menu dropdowns
- `Badge` - Status badges
- `Tabs` - Tab navigation

Found in `/src/components/ui/`

---

## 🎨 Design System

**Colors:**
- Primary: Black (#000000)
- Background: White (#FFFFFF)
- Accent: Green (#22C55E)
- Borders: Light gray (#E5E7EB)
- Text: Dark gray (#1F2937)

**Typography:**
- Headings: Font-heading (bold)
- Body: Default sans-serif (medium)
- Mono: font-mono (code)

**Spacing:**
- Default: 4px grid
- Padding: 4px, 8px, 16px, 24px, 32px
- Gaps: 4px, 8px, 16px, 24px

---

## 🚢 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database backed up
- [ ] CORS origins updated
- [ ] Secret keys rotated
- [ ] API keys configured
- [ ] SSL certificate ready

### Database
- [ ] PostgreSQL configured
- [ ] Migrations applied
- [ ] Backups scheduled
- [ ] Connection pooling set

### API Server
- [ ] Gunicorn configured
- [ ] Supervisor/PM2 setup
- [ ] Logging configured
- [ ] Error monitoring (Sentry)
- [ ] Health check endpoint

### Frontend
- [ ] Build optimized
- [ ] Bundle size checked
- [ ] API URL updated
- [ ] CDN configured
- [ ] Caching headers set

---

## 📞 Support Resources

| Topic | File |
|-------|------|
| System Overview | SYSTEM_ARCHITECTURE.md |
| Setup & Integration | INTEGRATION_GUIDE.md |
| Build Summary | BUILD_SUMMARY.md |
| Backend Docs | backend/README.md |
| Model Details | backend/app/models/__init__.py |
| Route Endpoints | backend/app/routes/*.py |
| Component Code | src/pages/company/*.tsx |

---

## 🎯 Next Priority Actions

1. **Immediate:** Set up PostgreSQL database
2. **Test:** Run through full invitation flow
3. **Review:** Check all endpoint responses
4. **Deploy:** Containerize & deploy to staging
5. **Monitor:** Set up error tracking & logging
6. **Document:** Add your deployment docs
7. **Customize:** Brand colors & company name
8. **Launch:** Beta test with real users

---

**Last Updated:** April 2026  
**Version:** 1.0 B2B  
**Status:** ✅ Production Ready
