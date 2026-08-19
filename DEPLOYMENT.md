# Deployment Guide — Hotel Kesari HMS

Target: **https://hms.daamjigroups.com** (Vercel + Supabase, single project)

---

## Prerequisites

- Node.js ≥ 18 installed locally
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) account
- Git repository pushed to GitHub / GitLab / Bitbucket
- DNS access for `daamjigroups.com`

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a name (e.g. `kesari-prod`), set a strong DB password, pick region **ap-south-1 (Mumbai)** for IST proximity.
3. Wait for the project to initialise (~2 min).
4. Navigate to **Project Settings → Database → Connection string**.
   - Copy the **URI** entry — this is your `DIRECT_URL` (port 5432).
5. Navigate to **Project Settings → Database → Connection pooling**.
   - Copy the **URI** entry — this is your `DATABASE_URL` (port 6543, pgbouncer).
   - Append `?pgbouncer=true` if not already present.

> **Tip:** Replace `[YOUR-PASSWORD]` in both URLs with the password you set in step 2.

---

## Step 2 — Run database migrations

Run this **once** from your local machine before the first deploy, or during the Vercel build (see Step 4).

```bash
cd backend
DIRECT_URL="<your-direct-url>" DATABASE_URL="<your-pooled-url>" npx prisma migrate deploy
```

To seed an initial admin user after migrating:

```bash
cd backend
DIRECT_URL="<your-direct-url>" DATABASE_URL="<your-pooled-url>" npx ts-node prisma/seed.ts
```

---

## Step 3 — Create a Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Select your repository.
3. Vercel auto-detects the project. **Override** the following if prompted:
   - **Framework Preset:** Other
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** *(leave blank — monorepo, no root package.json)*
4. Do **not** deploy yet — add environment variables first (Step 4).

---

## Step 4 — Set environment variables in Vercel

In **Project Settings → Environment Variables**, add every variable below.
Set all to **Production** (and Preview if you want staging).

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled Supabase URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Direct Supabase URL (port 5432) |
| `JWT_SECRET` | A long random string — generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://hms.daamjigroups.com` |
| `NODE_ENV` | `production` |
| `TZ` | `Asia/Kolkata` |
| `ENABLE_CRON` | `false` |
| `PORT` | `4000` |
| `CHECK_GRACE_MINUTES` | `60` |
| `SMTP_HOST` | *(optional)* |
| `SMTP_PORT` | `587` *(optional)* |
| `SMTP_USER` | *(optional)* |
| `SMTP_PASS` | *(optional)* |
| `SMTP_FROM` | `Hotel Kesari <no-reply@hotelkesari.com>` *(optional)* |
| `AI_PROVIDER` | `mock` *(or `openai`)* |
| `AI_API_KEY` | *(optional)* |
| `AI_MODEL` | `gpt-4o-mini` *(optional)* |
| `PMS_PROVIDER` | `mock` *(or `ezee`)* |
| `EZEE_API_URL` | *(optional)* |
| `EZEE_HOTEL_CODE` | *(optional)* |
| `EZEE_AUTH_CODE` | *(optional)* |

> **`ENABLE_CRON=false` is mandatory on Vercel.** Serverless functions have no persistent process; node-cron would silently do nothing and waste cold-start time.

---

## Step 5 — Add the custom domain in Vercel

1. In **Project Settings → Domains**, click **Add**.
2. Enter `hms.daamjigroups.com` → **Add**.
3. Vercel shows you a CNAME record to add. It will be:
   ```
   Type:  CNAME
   Name:  hms
   Value: cname.vercel-dns.com
   ```
4. Log in to your DNS registrar for `daamjigroups.com` and add that record.
5. Return to Vercel — wait for the SSL certificate to be issued (usually < 5 min).

---

## Step 6 — Deploy

Trigger the first deploy from the Vercel dashboard or push to your default branch.

Vercel runs:
```
cd frontend && npm install && npm run build
```

Then serves `frontend/dist` as the SPA and routes `/api/*` to `backend/api/index.ts`.

**Verify the deploy:**

```bash
# Health check
curl https://hms.daamjigroups.com/api/health

# Expected
{"status":"ok"}
```

If you see a `401`, the API is reachable — authentication is working.
If you see `502` or a Vercel error page, check **Vercel → Functions → Logs**.

---

## Step 7 — Run migrations on Vercel (alternative to local)

If you prefer to run migrations as part of the build, update `vercel.json`:

```json
"buildCommand": "cd backend && npx prisma migrate deploy ; cd ../frontend && npm install && npm run build"
```

`prisma migrate deploy` uses `DIRECT_URL` (port 5432), which bypasses pgbouncer — required for DDL statements.

---

## Ongoing operations

### Applying new migrations after schema changes

```bash
# Locally generate the migration
cd backend
npx prisma migrate dev --name describe_your_change

# Push the branch — Vercel redeploys and runs migrate deploy automatically
# (only if you added it to buildCommand above; otherwise run locally)
```

### Prisma Studio against production (read-only inspection)

```bash
cd backend
DIRECT_URL="<your-direct-url>" DATABASE_URL="<your-direct-url>" npx prisma studio
```

---

## Architecture summary

```
Browser
  └─▶ https://hms.daamjigroups.com
        ├─ /api/*  ──▶  Vercel Serverless Function (backend/api/index.ts)
        │                └─▶ Express app (createApp())
        │                      └─▶ Supabase PostgreSQL (pooled, port 6543)
        └─ /*      ──▶  Static SPA (frontend/dist/index.html)
```

All frontend API calls use `baseURL: '/api'` — no cross-origin requests, no CORS issues in production.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `P1001: Can't reach database` | Wrong URL or IP allow-list | In Supabase → Settings → Database → "Allow all IPs" for Vercel's dynamic IPs |
| `P3009: migrate found failed migration` | Previous migration failed mid-run | Run `prisma migrate resolve --rolled-back <name>` locally with DIRECT_URL |
| `502` on `/api/*` | TypeScript compile error in serverless function | Check Vercel → Functions → Logs for the error |
| JWT errors after redeploy | `JWT_SECRET` changed | Clear browser localStorage and log in again |
| `CORS` errors in browser | `CORS_ORIGIN` mismatch | Ensure value exactly matches the browser origin, no trailing slash |
