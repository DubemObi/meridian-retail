# Meridian Retail Group — Reverse Proxy & Multi-Service DevOps Foundations CI Test

**Amdari Internship Programme | DevOps Track — Beginner**

> Fork this repository. Do not modify the application source code — your work is the
> infrastructure around it: Nginx, DNS, TLS, Docker Compose, CI/CD, and backups.

## What This Project Teaches

How a real domain name takes a user from their browser to a running multi-service
application — the foundation every DevOps engineer needs before touching Kubernetes,
Traefik, or cloud-native tooling.

## Architecture

```
Browser → DNS (shop.yourdomain.com) → EC2 Public IP
            → Nginx (host, port 80/443, TLS via Certbot)
                → /              → frontend container   (port 8080)
                → /api/auth/     → auth-service          (port 8001)
                → /api/catalog/  → catalog-service        (port 8002)
                → /api/orders    → orders-service          (port 8003)
                      ↓ all three connect to ↓
                   postgres (port 5432, localhost only)
```

## Services

| Service | Stack | Port (container) | Role |
|---|---|---|---|
| auth-service | FastAPI | 8000 | Signup, login, JWT issuance |
| catalog-service | Express | 4000 | Product listings |
| orders-service | FastAPI | 8001 | Places orders — calls auth + catalog |
| frontend | Static HTML/JS via Nginx | 80 | User-facing storefront |
| postgres | PostgreSQL 16 | 5432 | Shared database |

## Quick Start (Local)

```bash
cp .env.example .env
# Edit .env with real values
docker compose up -d --build
curl http://localhost:8080
```

## Production Setup (EC2)

```bash
bash scripts/server_setup.sh
# Then follow the printed next steps:
# 1. Clone repo, configure .env
# 2. docker compose up -d
# 3. Install Nginx config from nginx/meridian-http.conf
# 4. sudo certbot --nginx -d shop.yourdomain.com
```

## Database Backups

```bash
# Manual backup
bash scripts/backup_db.sh

# Schedule daily at 2am
crontab -e
# Add: 0 2 * * * /home/ubuntu/meridian-retail/scripts/backup_db.sh >> /home/ubuntu/backup.log 2>&1

# Restore
bash scripts/restore_db.sh /home/ubuntu/backups/meridian/meridian_db_<timestamp>.sql.gz
```

## CI/CD

Push to any branch → `ci.yml` builds and tests all services.
Push to `main` → `deploy.yml` builds, pushes to ECR, SSHes into EC2, and redeploys.

## Required GitHub Secrets

| Secret | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | ECR push |
| `AWS_REGION` | e.g. eu-west-2 |
| `ECR_REGISTRY` | Your ECR registry URI |
| `EC2_HOST` / `EC2_USER` / `EC2_SSH_KEY` | SSH deploy target |
