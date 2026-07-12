# ─────────────────────────────────────────────────────────────
# Hotel Kesari — Frontend (React + Vite) served by Nginx.
# Nginx serves the static SPA and reverse-proxies /api to the backend.
# This container is the public web entrypoint / reverse proxy.
# ─────────────────────────────────────────────────────────────

# ---- Stage 1: build static assets ----
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: serve via nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA + API reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
