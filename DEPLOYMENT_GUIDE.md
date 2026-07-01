# Nextap Deployment Guide

## Local Development Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

### 2. Database Initialization
Create database tables:

```bash
cd backend
python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('✅ Database tables created!')
"
```

### 3. Run Backend
```bash
cd backend
python run.py
```
Backend will start on: **http://127.0.0.1:5000**

### 4. Run Frontend
```bash
npm run dev
```
Frontend will start on: **http://localhost:8080**

---

## Production Deployment (Railway/Vercel)

### Step 1: Set Environment Variables

On your hosting platform (Railway, Vercel, etc.), set these variables:

```
DATABASE_URL=postgresql+pg8000://user:password@host/dbname
FLASK_ENV=production
SECRET_KEY=your-secure-random-key
JWT_SECRET_KEY=your-secure-random-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
CF_ACCOUNT_ID=your-account-id
CF_AI_API_TOKEN=your-api-token
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 2: Database Migration on First Deploy

Add this to your deployment script or run manually:

```bash
python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
"
```

### Step 3: Verify Deployment

- **Backend API**: `https://your-backend.railway.app/`
- **Frontend**: `https://your-domain.com/`

Test endpoint: `https://your-backend.railway.app/api/health` (if health check exists)

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | `postgresql+pg8000://...` | PostgreSQL for production, SQLite for dev |
| `FLASK_ENV` | ✅ | `production` | Set to `production` on prod |
| `SECRET_KEY` | ✅ | Random string | Use strong random value |
| `JWT_SECRET_KEY` | ✅ | Random string | Use strong random value |
| `MAIL_USERNAME` | ✅ | Gmail address | For sending emails |
| `MAIL_PASSWORD` | ✅ | App password | NOT your Gmail password |
| `CF_ACCOUNT_ID` | ⚠️ | Cloudflare ID | For AI features (optional) |
| `CF_AI_API_TOKEN` | ⚠️ | Token | For AI features (optional) |
| `CORS_ORIGINS` | ✅ | Domain URLs | Comma-separated, no trailing slash |

---

## Database Setup on Railway

1. **Create PostgreSQL database** on Railway
2. **Copy connection string**
3. **Set `DATABASE_URL`** environment variable
4. **Deploy** - database tables will be created automatically

---

## Troubleshooting

### "relation 'user' does not exist"
Database tables haven't been created. Run the initialization script above.

### "No such table: user"
Same issue - run database creation command.

### CORS errors in browser
Update `CORS_ORIGINS` environment variable with your frontend URL.

### 502 Bad Gateway
- Check if backend is actually running
- Check logs for startup errors
- Verify environment variables are set

---

## Performance Optimizations (Already Applied)

✅ **API Response Caching** - 5-minute cache for public profiles  
✅ **Parallel API Calls** - Frontend loads data 3x faster  
✅ **Eager Loading** - Prevents N+1 database queries  
✅ **Lazy Image Loading** - Heavy images load separately  

---

## Security Checklist

- [ ] Never commit `.env` file to Git
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET_KEY` (32+ characters)
- [ ] Never use your Gmail password - use App Password instead
- [ ] Keep API tokens in environment variables, not in code
- [ ] Use HTTPS URLs in `CORS_ORIGINS` for production
- [ ] Regularly rotate secrets
- [ ] Monitor API usage and rate limits

---

## Need Help?

Check these files:
- `backend/.env.example` - Environment variable template
- `backend/app/config.py` - Flask configuration
- `backend/requirements.txt` - Python dependencies
- `package.json` - Frontend dependencies
