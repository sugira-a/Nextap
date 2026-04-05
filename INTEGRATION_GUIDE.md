# NexTap B2B Platform - Integration & Setup Guide

## Quick Start

### Prerequisites
- Node.js 16+ (Frontend)
- Python 3.9+ (Backend)
- PostgreSQL 12+ (Database)
- npm/yarn (Frontend package manager)
- pip (Python package manager)

---

## Frontend Setup

### 1. Installation
```bash
cd /path/to/Nextap
npm install
```

### 2. Configuration
Create `.env.local` in root:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=NexTap
```

### 3. Running
```bash
npm run dev
```
Opens at: `http://localhost:8080` (Vite default)

### 4. Production Build
```bash
npm run build        # Creates dist/
npm run preview      # Preview production build
```

---

## Backend Setup

### 1. Installation
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # Unix/Mac

pip install -r requirements.txt
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb nextap_db

# Or using psql:
# CREATE DATABASE nextap_db;
```

### 3. Configuration
Create `.env` in `/backend`:
```env
FLASK_ENV=development
SECRET_KEY=your-dev-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://localhost:5432/nextap_db
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

### 4. Database Initialization
```bash
# Create tables
flask db upgrade

# Seed sample data (optional)
flask seed-db
```

### 5. Running
```bash
python run.py
```
Server runs at: `http://localhost:5000`

---

## API Integration

### Frontend ↔ Backend Communication

#### 1. Authentication Flow

**Register:**
```typescript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe'
  })
});

const data = await response.json();
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
```

**Login:**
```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('access_token', data.access_token);
```

**Protected Requests:**
```typescript
const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

#### 2. Company Operations

**Create Company:**
```typescript
const response = await fetch('http://localhost:5000/api/company/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: 'professional'
  })
});
```

**Fetch Company:**
```typescript
const response = await fetch('http://localhost:5000/api/company/:id', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Get Company Stats:**
```typescript
const response = await fetch('http://localhost:5000/api/company/:id/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### 3. Employee Management

**List Employees:**
```typescript
const response = await fetch(
  'http://localhost:5000/api/company/:id/employees?page=1&per_page=20',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

**Invite Employee:**
```typescript
const response = await fetch('http://localhost:5000/api/company/:id/invitations/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'employee@company.com',
    role: 'employee',
    card_id: 'card-uuid-optional'
  })
});

const data = await response.json();
const inviteLink = data.invitation_link;  // Share with employee
```

**Update Employee:**
```typescript
const response = await fetch(
  'http://localhost:5000/api/company/:id/employees/:employee_id/update',
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: 'suspended',
      department_id: 'dept-uuid',
      role: 'company_admin'
    })
  }
);
```

#### 4. Card Management

**Get Card:**
```typescript
// Public endpoint - no auth needed for unclaimed cards
const response = await fetch('http://localhost:5000/api/card/:code');

const data = await response.json();
if (data.status === 'unclaimed') {
  // Show activation form
} else if (data.status === 'claimed') {
  // Redirect to /u/:username
  window.location.href = data.redirect;
}
```

**Claim Card:**
```typescript
const response = await fetch('http://localhost:5000/api/card/claim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    code: 'NFC_CODE_HERE'
  })
});

const data = await response.json();
// User's card is now claimed
```

**Assign Card:**
```typescript
const response = await fetch(
  'http://localhost:5000/api/card/:card_id/assign',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: 'user-uuid'
    })
  }
);
```

#### 5. Profile Management

**Get Public Profile:**
```typescript
// Public endpoint
const response = await fetch('http://localhost:5000/api/profile/:slug');
const profile = await response.json();
```

**Update Own Profile:**
```typescript
const response = await fetch('http://localhost:5000/api/profile/me/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    public_slug: 'john-doe',
    title: 'Software Engineer',
    bio: 'Building great software',
    phone: '+1-555-0000',
    website: 'https://johndoe.com',
    location: 'San Francisco, CA',
    photo_url: 'https://example.com/photo.jpg'
  })
});
```

#### 6. Analytics

**Company Analytics:**
```typescript
const response = await fetch(
  'http://localhost:5000/api/analytics/company/:company_id?days=30',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const data = await response.json();
console.log(data.analytics.total_events);
console.log(data.analytics.taps);
console.log(data.analytics.events_by_day);
```

**User Analytics:**
```typescript
const response = await fetch(
  'http://localhost:5000/api/analytics/user/:user_id?days=30',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

## Frontend API Integration Layer (Recommended)

Create `/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export const API = {
  // Auth
  register: (data) => apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (data) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCurrentUser: () => apiCall('/api/auth/me'),
  
  // Company
  getCompany: (id) => apiCall(`/api/company/${id}`),
  createCompany: (data) => apiCall('/api/company/create', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCompanyStats: (id) => apiCall(`/api/company/${id}/stats`),
  
  // Employees
  getEmployees: (companyId, params = {}) => {
    const query = new URLSearchParams(params);
    return apiCall(`/api/company/${companyId}/employees?${query}`);
  },
  getEmployee: (companyId, employeeId) => 
    apiCall(`/api/company/${companyId}/employees/${employeeId}`),
  
  // Invitations
  sendInvitation: (companyId, data) => apiCall(
    `/api/company/${companyId}/invitations/send`,
    { method: 'POST', body: JSON.stringify(data) }
  ),
  acceptInvitation: (token, data) => apiCall(
    `/api/auth/invitation/${token}/accept`,
    { method: 'POST', body: JSON.stringify(data) }
  ),
  
  // Cards
  getCard: (code) => fetch(`${API_URL}/api/card/${code}`).then(r => r.json()),
  claimCard: (data) => apiCall('/api/card/claim', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Analytics
  getCompanyAnalytics: (companyId, days = 30) => 
    apiCall(`/api/analytics/company/${companyId}?days=${days}`),
};
```

Usage in components:
```typescript
import { API } from '@/lib/api';

// In a component:
const company = await API.getCompany(companyId);
const stats = await API.getCompanyStats(companyId);
```

---

## CORS Configuration

### Development
Both frontend and backend run locally on different ports. CORS is configured automatically in backend:

```python
CORS_ORIGINS = [
  "http://localhost:8080",    # Vite default
  "http://localhost:3000",    # Alternative
  "http://localhost:5173"     # Vite new default
]
```

### Production
Update `CORS_ORIGINS` in backend `.env`:
```env
CORS_ORIGINS=https://app.nextap.com,https://dashboard.nextap.com
```

---

## Database Migrations

### Create Migration
```bash
flask db migrate -m "Add new field"
```

### Apply Migration
```bash
flask db upgrade
```

### Rollback
```bash
flask db downgrade
```

---

## Testing API Locally

### Using curl
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (with token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import endpoints from API documentation
2. Set `{{base_url}}` variable to `http://localhost:5000`
3. Use "Tests" tab to automatically set token:
```javascript
var jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.access_token);
```

---

## Troubleshooting

### Frontend Can't Reach Backend
```bash
# Check backend is running
curl http://localhost:5000/api/auth/me
# Should return 401 (expected without token)

# Check CORS headers
curl -i http://localhost:5000/api/auth/me
# Look for Access-Control-Allow-Origin header
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U username -d nextap_db -c "SELECT 1"

# Check DATABASE_URL format
# postgresql://user:password@host:port/dbname
```

### Token Expiration
```typescript
// Auto-refresh logic (add to api layer)
if (response.status === 401) {
  const refreshToken = localStorage.getItem('refresh_token');
  // Implement refresh token endpoint
  // Then retry original request
}
```

---

## Performance Tips

### Frontend
- Use React Query for data caching
- Lazy load company features behind authentication
- Implement pagination for tables
- Optimize images before upload

### Backend
- Database indices on frequently queried fields
- Query pagination for large datasets
- Cache analytics aggregations
- Monitor slow queries

---

## Next Steps

1. **Generate Test Data**
   ```bash
   flask seed-db
   ```

2. **Start Development**
   ```bash
   # Terminal 1: Backend
   cd backend && python run.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

3. **Test User Flow**
   - Register account at `/register`
   - Create company in backend
   - Invite employee via UI
   - Accept invitation
   - Complete profile
   - View analytics

4. **Deploy**
   - See deployment docs in backend/README.md

---

**Support:** See individual README files in `/backend` and `/src`
