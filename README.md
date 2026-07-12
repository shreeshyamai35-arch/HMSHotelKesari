# Hotel Kesari — Operations, Reporting & Analytics Suite

A complete, portable web application for daily hotel operations reporting, checklist
management, performance tracking, analytics, PDF reporting, notifications, and AI insights.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | Prisma ORM — SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcrypt (self-hosted) |
| PDF | pdfmake (server-side) |
| Scheduling | node-cron |
| Packaging | Docker + Docker Compose |

## Project Structure

```
.
├── backend/          # Node + Express + Prisma API
├── frontend/         # React + Vite + Tailwind SPA
├── nginx/            # Reverse proxy config (production)
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Dev — zero external dependencies)

The local dev setup uses SQLite, so you need **only Node.js** — no database server,
no Docker.

### 1. Backend

```bash
cd backend
npm install
npm run db:setup     # generate client + migrate + seed demo data
npm run dev          # starts API on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts UI on http://localhost:5173
```

Open http://localhost:5173 and log in with one of the seeded accounts below.

## Demo Accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | admin@hotelkesari.com | Admin@123 |
| Front Office | frontoffice@hotelkesari.com | Front@123 |
| Revenue Team | revenue@hotelkesari.com | Revenue@123 |
| Management | management@hotelkesari.com | Manage@123 |

## Production (PostgreSQL + Docker, per PRD)

The production stack uses PostgreSQL and runs identically on any host
(Google Cloud VM, Oracle Cloud, Hetzner, AWS, Azure).

```bash
docker compose up -d --build
```

See `docs/DEPLOYMENT.md` for switching the Prisma provider to PostgreSQL and
full deployment steps.

## Portability

- All DB access is through Prisma — switching SQLite → PostgreSQL is a one-line
  provider change plus the `DATABASE_URL`.
- All configuration is via environment variables (`.env`).
- The entire stack is containerized for identical runs on any host.
