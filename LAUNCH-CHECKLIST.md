# Launch Checklist

Pre-launch verification steps for Hotel Kesari HMS deployment.

## 1. Health Check

**Test:** Verify API is reachable and database is connected.

```bash
curl https://hms.daamjigroups.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-19T12:34:56.789Z",
  "database": "connected"
}
```

**Pass Criteria:** Status 200, `status: "ok"`, `database: "connected"`

---

## 2. Login Flow Test

**Test:** Authenticate with valid credentials.

```bash
curl -X POST https://hms.daamjigroups.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**Pass Criteria:** Status 200, valid JWT token returned, user object present

**Follow-up:** Test protected route with token:
```bash
curl https://hms.daamjigroups.com/api/settings \
  -H "Authorization: Bearer <token>"
```

---

## 3. Occupancy Submission Test

**Test:** Submit daily occupancy data.

```bash
curl -X POST https://hms.daamjigroups.com/api/occupancy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-08-19",
    "occupied": 18,
    "available": 24,
    "revenue": 45000,
    "avgRate": 2500
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "date": "2026-08-19T00:00:00.000Z",
  "occupied": 18,
  "available": 24,
  "revenue": 45000,
  "avgRate": 2500,
  "occupancyRate": 75.00,
  "createdAt": "2026-08-19T12:34:56.789Z"
}
```

**Pass Criteria:** Status 201, occupancyRate calculated correctly (75%), data persisted

**Verify:** Retrieve the submitted data:
```bash
curl "https://hms.daamjigroups.com/api/occupancy?startDate=2026-08-19&endDate=2026-08-19" \
  -H "Authorization: Bearer <token>"
```

---

## 4. PDF Generation Test

**Test:** Generate monthly occupancy report PDF.

```bash
curl "https://hms.daamjigroups.com/api/occupancy-reports/pdf?month=2026-08" \
  -H "Authorization: Bearer <token>" \
  --output occupancy-report.pdf
```

**Expected Response:**
- HTTP Status: 200
- Content-Type: `application/pdf`
- File size: > 0 bytes
- Valid PDF that opens without errors

**Pass Criteria:**
1. PDF downloads successfully
2. Opens in PDF viewer
3. Contains hotel branding
4. Shows correct month/year
5. Displays occupancy data table
6. Includes summary metrics (avg occupancy %, total revenue)

**Manual Verification:** Open `occupancy-report.pdf` and confirm:
- Date range matches request
- Data accuracy against database
- Formatting is readable
- No rendering errors

---

## 5. Commission Calculation Test

**Test:** Calculate commissions for a booking agent.

```bash
curl -X POST https://hms.daamjigroups.com/api/commissions/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "uuid-of-agent",
    "bookingValue": 50000,
    "checkInDate": "2026-08-20",
    "checkOutDate": "2026-08-22"
  }'
```

**Expected Response:**
```json
{
  "bookingValue": 50000,
  "commissionRate": 10,
  "commissionAmount": 5000,
  "agentId": "uuid-of-agent",
  "agentName": "MakeMyTrip",
  "calculatedAt": "2026-08-19T12:34:56.789Z"
}
```

**Pass Criteria:**
- Status 200
- Commission calculated correctly (10% of 50000 = 5000)
- Agent details returned
- Formula matches settings configuration

**Verify:** Check commission settings match:
```bash
curl https://hms.daamjigroups.com/api/settings/commissions \
  -H "Authorization: Bearer <token>"
```

Expected settings structure:
```json
{
  "defaultRate": 10,
  "agents": [
    {
      "id": "uuid",
      "name": "MakeMyTrip",
      "rate": 10
    }
  ]
}
```

---

## Pre-Launch Checklist Summary

- [ ] Health check passes
- [ ] Login succeeds and returns valid token
- [ ] Protected routes accept token
- [ ] Occupancy data submits and calculates correctly
- [ ] Occupancy data retrieves successfully
- [ ] PDF generates without errors
- [ ] PDF content is accurate and formatted
- [ ] Commission calculation matches expected formula
- [ ] Commission settings are configured
- [ ] All tests return expected HTTP status codes
- [ ] Error responses are handled gracefully (test one invalid request per endpoint)

---

## Environment-Specific Notes

**Production URL:** `https://hms.daamjigroups.com`

**Database:** Verify connection string points to production PostgreSQL instance

**Authentication:** Ensure admin credentials are set and secure

**CORS:** Confirm frontend domain is whitelisted if applicable

**Rate Limiting:** Verify API rate limits are configured appropriately

---

## Rollback Plan

If any critical test fails:

1. Do not proceed with launch
2. Document the failure in detail
3. Roll back to previous stable version if already deployed
4. Investigate root cause in staging environment
5. Re-run full checklist after fix
