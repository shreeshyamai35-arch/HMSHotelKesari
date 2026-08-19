# Supabase Database Setup Required

## Current Issue
The Vercel environment variables reference a non-existent Supabase project:
- Current: `postgres.oywrztzfqygxnwtudltu` (doesn't exist)
- Documentation shows: `db.btaqkfimyfposylzngre` (may be from old setup)

Error: `FATAL: (ENOTFOUND) tenant/user postgres.oywrztzfqygxnwtudltu not found`

## Solution Options

### Option 1: Create New Supabase Project (Recommended)
1. Go to https://supabase.com and sign in
2. Create new project named "hotel-kesari-hms"
3. Set region to "ap-south-1" (Mumbai, closest to target market)
4. Copy connection strings:
   - Transaction pooler (port 6543): For DATABASE_URL with `?pgbouncer=true&connection_limit=1`
   - Session pooler (port 5432): For DIRECT_URL
5. Update Vercel environment variables:
   ```bash
   vercel env rm DATABASE_URL production
   vercel env rm DIRECT_URL production
   vercel env add DATABASE_URL production
   vercel env add DIRECT_URL production
   ```
6. Run migration:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Use Existing Project from Documentation
If the `btaqkfimyfposylzngre` project still exists:
1. Update Vercel env vars to use those connection strings
2. Test connection locally first

## Required Connection String Format
```
# Pooled connection (for app queries)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Direct connection (for migrations)
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

## Current Blocking Issues
1. Database connection fails with ENOTFOUND
2. Cannot run migrations
3. API endpoints return 500 errors
4. Login functionality completely broken

**Action Required**: User must either provide valid Supabase credentials or authorize creation of new project.
