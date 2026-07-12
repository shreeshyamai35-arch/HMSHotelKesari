# Product Requirements Document (PRD)

## Hotel Operations, Reporting & Analytics Web Application

**Client:** Hotel Kesari
**Document Version:** 2.0 (Portable Stack Edition)
**Scope:** Complete solution (all modules built together — not phased)
**Primary Hosting:** Google Cloud (portable, zero vendor lock-in)

---

## 1. Overview

A web-based application for daily hotel operations reporting, checklist management, performance tracking, analytics, and PMS integration for Hotel Kesari.

The application is built as a **single complete solution** delivering operations reporting, dashboards, PDF reporting, notifications, reviews tracking, revenue & booking analytics, team performance, PMS integration, and AI insights.

### Design Goals
- **Portable / no vendor lock-in** — runs identically on Google Cloud, Oracle Cloud, Hetzner, AWS, Azure, or any Linux server.
- **Lowest possible long-term cost** — runs on a single server (free or ~$5/month) for years.
- **Professional, modern, mobile-friendly** hotel management interface.
- **Real SQL database** to fully support analytics and reporting modules.

---

## 2. Technology Stack (Portable, Lock-In Free)

The stack uses only open-source, standard technologies that run on any cloud or server. This is what makes the app portable.

| Layer | Technology | Why (Portability) |
|---|---|---|
| **Frontend** | React (Vite) + TypeScript | Builds to static files; runs anywhere |
| **UI Components** | Tailwind CSS + shadcn/ui | No vendor dependency |
| **Charts** | Recharts | Open-source |
| **Backend** | Node.js + Express + TypeScript | Standard runtime, runs on any OS |
| **Database** | PostgreSQL | Universal SQL DB; portable via `pg_dump` |
| **ORM** | Prisma | Portable schema + migrations |
| **Authentication** | Self-hosted JWT + bcrypt | No proprietary auth service |
| **PDF Generation** | `pdfmake` / `pdf-lib` (server-side) | No paid/external PDF service |
| **File Storage** | Local volume / S3-compatible API | S3 API works on every cloud |
| **Notifications** | In-app + email (SMTP / Nodemailer) | Standard protocols |
| **Scheduled Jobs** | `node-cron` inside the app | No cloud-specific scheduler |
| **AI Insights** | Pluggable LLM adapter (cheap API or self-hosted model) | Swappable provider |
| **Packaging** | **Docker + Docker Compose** | Runs identically on any host |
| **Reverse Proxy / SSL** | Nginx + Let's Encrypt (Caddy optional) | Standard, free SSL |
| **Source Control** | Git / GitHub | Code is instantly portable |

### Portability Rules (Mandatory)
1. **No proprietary cloud services** in the core app (no Firestore, no Firebase Auth, no BigQuery-dependent logic, no cloud-specific function runtimes).
2. **Everything containerized** with Docker so the same image runs on any host.
3. **All configuration via environment variables** (`.env`) — never hard-code provider details.
4. **File storage behind an S3-compatible interface** so storage backend can be swapped.
5. **Database access only through the ORM** so the data layer stays standard SQL.

---

## 3. Hosting & Deployment

### Primary Target: Google Cloud
- Deploy on a **Compute Engine VM** (plain Linux VM, NOT App Engine / Firebase).
- Run the full stack via **Docker Compose** on the VM:
  - React frontend (served as static files via Nginx)
  - Node.js backend API
  - PostgreSQL database
  - Nginx reverse proxy + SSL
- Use **Google Cloud's free trial credit ($300 / 90 days)** and/or the **Always Free e2-micro tier** to start at zero cost.

### Migration Path (Built-in, ~1 day)
Because the stack is portable, moving to another host requires only:
1. Copy code from Git.
2. Export DB with `pg_dump`, import on the new host.
3. Run the same `docker compose up` on the new server.
4. Repoint domain DNS.

No code rewrite is required to move to Oracle Cloud (free forever), Hetzner (~$5/mo), AWS, or Azure.

### Cost Target
- **Initial:** $0 (Google Cloud free credit).
- **Long-term:** $0 (Oracle free tier) to ~$5/month (Hetzner), plus optional domain (~$12/year).

---

## 4. User Roles

| Role | Description |
|---|---|
| **Admin** | Full access; manage users, roles, all data, system settings. |
| **Front Office** | Submit daily operations reports, view own history, dashboard. |
| **Revenue Team** | Access revenue, booking, and review analytics modules. |
| **Management** | View dashboards, analytics, reports, AI insights (read-focused). |

- Role-based access control enforced on **both** the backend API and the frontend UI.
- Admin can add/edit users and assign roles in-app (no code changes needed).

---

## 5. Functional Requirements (Complete Solution)

### 5.1 Authentication & User Management
- Secure login (email + password, hashed with bcrypt, JWT sessions).
- Role-based authorization for all routes and screens.
- Admin user-management screen: create users, assign role + department, deactivate users.
- Password reset flow.

### 5.2 Daily Operations Report
Front Office submits a Daily Operations Report via a simple, mobile-friendly form.

**A. Genset Checks**
- **Morning Genset Check** (scheduled 7:00 AM): Status (Working / Not Working), Fuel Level, Remarks, Employee Name, automatic timestamp.
- **Evening Genset Check** (scheduled 7:00 PM): Status (Working / Not Working), Fuel Level, Remarks, Employee Name, automatic timestamp.

**B. Water Tank Checks** (4 daily slots: 7:00 AM, 12:00 PM, 4:00 PM, 9:00 PM)
For each check: Tank Status (Full / Medium / Low), Remarks, Employee Name, automatic timestamp.

**C. Utility & Operations Checklist** (status per item)
- Main Electricity Supply Working
- Lift Working
- WiFi Working
- CCTV Working
- Fire Safety System Working
- RO Water Available
- Parking Area Clean
- Housekeeping Status
- Borewell Status
- Generator Diesel Stock Checked

**D. Issue Reporting Section**
- Guest Complaints
- Maintenance Issues
- Lost and Found Items
- Special Incidents
- Remarks

### 5.3 Employee Accountability
The system must:
- Record employee name and department.
- Record date and time (automatic timestamps).
- Maintain complete report history.
- Track who completed each task.

### 5.4 Dashboard
Display cards and charts for:
- Today's Checklist Status
- Completed Tasks
- Pending Tasks
- Daily Reports Submitted
- Open Complaints
- Open Maintenance Issues
- Recent Reports

### 5.5 Automatic PDF Report
Generate a professional **Daily Operations Report** PDF, branded **"Hotel Kesari"**, containing:
- Date, Employee Name, Submission Time
- Genset Checks, Water Tank Checks
- Utility Checklist
- Complaints, Maintenance Issues, Remarks

**PDF Features:** Download button, View Previous Reports, Print option. Generated PDFs stored for retrieval.

### 5.6 Notifications & Alerts
Show alerts for:
- Missed Genset Check (with configurable grace period after scheduled time)
- Missed Water Tank Check
- Pending Daily Report
- Open Maintenance Issues

Delivery: in-app notifications + optional email. Scheduled checks run via in-app cron jobs.

### 5.7 Review Tracker
- Google Reviews tracking
- OTA Reviews tracking
- Rating Analysis
- Complaint Analysis
- **Data input:** designed to support both API ingestion and manual entry (source to be finalized; both paths built).

### 5.8 Revenue Analytics
- Revenue Tracking
- ADR (Average Daily Rate)
- RevPAR (Revenue Per Available Room)
- Revenue Targets (set and track vs. actual)

### 5.9 Booking Analytics
- Occupancy
- Booking Sources
- Reservation Trends

### 5.10 Team Performance Dashboard
- Track task completion, report submission, and accountability metrics per employee/department.

### 5.11 eZee Absolute PMS Integration
- Integration layer (service module) to sync booking/revenue data from eZee Absolute.
- Built with a pluggable adapter; wired to the live API + MCP when credentials are provided.
- Synced data transformed and stored in PostgreSQL to power Revenue & Booking Analytics.

### 5.12 AI Insights & Management Reports
- Generate AI-driven insights and management summary reports from operational and analytics data.
- Pluggable LLM adapter (cheap API or self-hosted model) so the AI provider can be swapped.

---

## 6. Database (PostgreSQL)

Core entities to store:
- **Users** (name, email, password hash, role, department, status)
- **Daily Reports** (date, employee, department, submission time)
- **Genset Checks** (report ref, type morning/evening, status, fuel level, remarks, timestamp)
- **Water Tank Checks** (report ref, slot time, status, remarks, timestamp)
- **Utility Checklist** (report ref, per-item status)
- **Complaints** (report ref, details, status open/closed)
- **Maintenance Issues** (report ref, details, status open/closed)
- **Lost & Found / Incidents** (report ref, details)
- **PDF Reports** (report ref, file reference, generated time)
- **Reviews** (source, rating, text, date) — for Review Tracker
- **Revenue Records** (date, revenue, ADR, RevPAR, targets) — for Revenue Analytics
- **Bookings** (date, source, occupancy, status) — for Booking Analytics
- **Notifications** (type, target user/role, status, timestamp)

All schema managed via Prisma migrations for portability.

---

## 7. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Users** | ~10 total, 2–3 concurrent (low load) |
| **Responsiveness** | Mobile-friendly, responsive web (desktop + phone) |
| **UI** | Modern, professional hotel-management dashboard |
| **Performance** | Fast data entry; dashboards load quickly at this scale |
| **Security** | Hashed passwords, JWT auth, role-based access, HTTPS/SSL |
| **Portability** | Dockerized; runs on any cloud/VPS with no code change |
| **Backups** | Scheduled PostgreSQL dumps to storage |
| **Cost** | $0–$5/month long-term target |
| **Maintainability** | Clean separation of services; config via env vars |

---

## 8. Architecture Summary

```
                 ┌──────────────────────────────────────────┐
                 │        Single Server (Google Cloud VM)     │
                 │              Docker Compose                 │
                 │                                            │
   Browser ───►  │  Nginx (SSL) ──► React (static frontend)   │
   (desktop/     │       │                                    │
    mobile)      │       └──► Node.js + Express API           │
                 │                  │                         │
                 │                  ├──► PostgreSQL (data)     │
                 │                  ├──► PDF generator         │
                 │                  ├──► Cron (alerts/sync)    │
                 │                  ├──► eZee PMS adapter      │
                 │                  └──► AI insights adapter   │
                 └──────────────────────────────────────────┘

  Portable: same Docker stack runs on Oracle Cloud / Hetzner / AWS / Azure.
```

---

## 9. Out-of-Scope / Future Considerations
- Native mobile app (current app is responsive web; Node/React stack allows future mobile reuse).
- Multi-property support (architecture allows extension if Hotel Kesari adds properties).

---

## 10. Key Decisions Log
- **Hosting:** Google Cloud VM to start (free credit / always-free tier), portable to anywhere.
- **Database:** PostgreSQL (SQL) chosen over NoSQL to properly support analytics modules.
- **No vendor lock-in:** Strict use of open-source, containerized components.
- **Complete build:** All modules delivered as one solution (not phased).
- **Cost priority:** Designed to run at $0–$5/month for years.
Done. I've created your complete, portable-stack PRD at PRD.md.