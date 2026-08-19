# Vercel Deployment Guide

## Database Setup ✅ COMPLETE
- ✅ Supabase PostgreSQL configured
- ✅ Schema migrated successfully
- ✅ Database seeded with initial data

**Admin Credentials (SAVE THIS):**
- Email: `admin@hotelkesari.com`
- Password: `821062ffc78b2b0c28af648bc2a38abf`

---

## Deploy to Vercel

### 1. Import GitHub Repository
1. Go to https://vercel.com/new
2. Import repository: `shreeshyamai35-arch/kesari`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`

### 2. Environment Variables
Add these in Vercel project settings → Environment Variables:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:9qffevxi4!Q-DXM@db.btaqkfimyfposylzngre.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:9qffevxi4!Q-DXM@db.btaqkfimyfposylzngre.supabase.co:5432/postgres

# Auth
JWT_SECRET=prod-hms-kesari-secure-2026-launch-secret-key-v1
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://hms.daamjigroups.com

# Server
NODE_ENV=production
PORT=4000
TZ=Asia/Kolkata

# Cron (must be false on Vercel serverless)
ENABLE_CRON=false

# SMTP (optional - for email notifications)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Hotel Kesari <no-reply@hotelkesari.com>

# AI (optional - for analytics)
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=gpt-4o-mini

# PMS (optional - eZee integration)
PMS_PROVIDER=mock
EZEE_API_URL=
EZEE_HOTEL_CODE=
EZEE_AUTH_CODE=

# Occupancy check grace period
CHECK_GRACE_MINUTES=60
```

### 3. Deploy
1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide a production URL (e.g., `kesari-xyz.vercel.app`)

### 4. Configure Custom Domain
1. In Vercel project → Settings → Domains
2. Add domain: `hms.daamjigroups.com`
3. Vercel will show DNS instructions
4. Add CNAME record in your DNS provider:
   - **Name**: `hms`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600
5. Wait for DNS propagation (5-30 minutes)
6. Vercel will auto-issue SSL certificate

---

## Verify Production

### Health Check
Visit: `https://hms.daamjigroups.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-19T...",
  "environment": "production",
  "timezone": "Asia/Kolkata"
}
```

### Login Test
1. Visit: `https://hms.daamjigroups.com`
2. Login with admin credentials above
3. Verify dashboard loads
4. Check Daily Report submission works
5. Check Occupancy Manager loads

---

## Post-Launch

### Security
- ✅ Demo credentials removed from UI
- ✅ JWT_SECRET enforced in production
- ✅ Rate limiting on login (5 attempts/15min)
- ✅ Active user validation on auth
- ✅ Strong passwords enforced in seed

### Monitoring
- Check Vercel deployment logs for errors
- Monitor Supabase connection count
- Watch for failed auth attempts in logs

### Backup
Set up automated backups in Supabase:
1. Project Settings → Database → Backups
2. Enable Point-in-Time Recovery (PITR)
3. Configure backup schedule

---

## Troubleshooting

### Build fails
- Check `vercel.json` configuration
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### API 500 errors
- Verify DATABASE_URL is correct (port 6543 with pgbouncer=true)
- Check JWT_SECRET is set
- Review function logs in Vercel

### CORS errors
- Verify CORS_ORIGIN matches your domain exactly
- No trailing slash in CORS_ORIGIN
- Check browser console for specific error

### Database connection fails
- Test connection from backend:
  ```bash
  cd backend
  DATABASE_URL="..." npx prisma db pull
  ```
- Verify Supabase project is not paused
- Check connection string format
