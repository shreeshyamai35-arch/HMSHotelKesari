# ─────────────────────────────────────────────────────────────
# Hotel Kesari — Backend API (Node + Express + Prisma)
# Multi-stage build. Produces a PostgreSQL-ready production image.
# Local dev still uses SQLite via `npm run dev` (this image is for prod).
# ─────────────────────────────────────────────────────────────

# ---- Stage 1: build ----
FROM node:20-slim AS builder
WORKDIR /app

# Prisma needs openssl on Debian-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
# Switch the Prisma datasource provider to PostgreSQL for the production image.
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma \
    && npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Bring over installed deps (incl. generated Prisma client + tsx for seeding),
# the compiled app, the (postgres-adjusted) schema and the seed script.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Storage for generated PDF reports (mounted as a volume in compose).
RUN mkdir -p storage/pdf

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
