# Deployment Guide — Hotel Kesari Suite

This stack is **portable** and runs identically on any Linux host (Google Cloud
VM, Oracle Cloud, Hetzner, AWS, Azure, or bare metal). The only requirement on
the server is **Docker + Docker Compose**.

```
   web (nginx)  ──►  React SPA + reverse-proxy /api
        │
        └──►  backend (Node/Express + Prisma)  ──►  db (PostgreSQL 16)
```

- Local development uses **SQLite** (zero setup — see the root `README.md`).
- This Docker stack uses **PostgreSQL** for production. The backend image
  automatically switches the Prisma provider to `postgresql` at build time, so
  no manual schema edit is required.

---

## 1. Prerequisites on the server

```bash
# Install Docker Engine + Compose plugin (Debian/Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out/in afterwards
docker compose version          # verify
```

## 2. Get the code

```bash
git clone <your-repo-url> kesari
cd kesari
```

## 3. Configure environment

```bash
cp .env.docker.example .env
nano .env
```

Set at minimum:
- `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`).
- `POSTGRES_PASSWORD` — a strong database password.
- `CORS_ORIGIN` — your public URL (e.g. `https://ops.hotelkesari.com`).
- For the **first** deploy only, set `SEED_ON_START=true` to create demo
  users/data, then set it back to `false` and redeploy.

## 4. Build and start

```bash
docker compose up -d --build
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f backend
```

The app is now served on `http://<server-ip>:${WEB_PORT}` (default port 80).

## 5. Seed initial data (first deploy only)

If you did **not** set `SEED_ON_START=true`, seed the demo accounts manually:

```bash
docker compose exec backend npm run db:seed
```

Seeded logins (change the passwords after first login):

| Role | Email | Password |
|---|---|---|
| Admin | admin@hotelkesari.com | Admin@123 |
| Front Office | frontoffice@hotelkesari.com | Front@123 |
| Revenue Team | revenue@hotelkesari.com | Revenue@123 |
| Management | management@hotelkesari.com | Manage@123 |

---

## 6. HTTPS / SSL

The `web` container terminates plain HTTP on port 80. For production TLS, pick
one of these standard, portable options:

**Option A — Caddy in front (simplest, auto Let's Encrypt):**
Run a Caddy container that reverse-proxies to the `web` service and obtains
certificates automatically:

```
yourdomain.com {
    reverse_proxy web:80
}
```

**Option B — Certbot + the host's nginx:**
Install nginx on the VM, proxy `:443` → `web` container's published port, and
issue a certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ops.hotelkesari.com
```

Either way, set `CORS_ORIGIN=https://yourdomain.com` in `.env` and redeploy.

---

## 7. Backups (PostgreSQL)

```bash
# Backup
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup_$(date +%F).sql

# Restore
cat backup_2026-01-01.sql | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Schedule the backup with a host cron job and copy the dump to off-server storage
(any S3-compatible bucket, rsync, etc.).

---

## 8. Updating the app

```bash
git pull
docker compose up -d --build
```

The backend runs `prisma db push` on every start, so schema changes are applied
automatically. Generated PDF reports persist in the `pdf_storage` volume and the
database persists in the `db_data` volume across rebuilds.

---

## 9. Migrating to another host (≈1 day, no code changes)

1. `pg_dump` the database on the old host (step 7).
2. `git clone` the repo on the new host.
3. Copy your `.env` and the SQL dump over.
4. `docker compose up -d --build`, then restore the dump.
5. Repoint DNS to the new server.

That's the whole point of the portable stack — same `docker compose up`
everywhere.

---

## 10. Common commands

```bash
docker compose ps                     # service status
docker compose logs -f backend        # follow API logs
docker compose restart backend        # restart API
docker compose down                   # stop (keeps volumes/data)
docker compose down -v                # stop AND delete data (careful!)
```
