# SPYRAL OS Deployment Guide

> **Document Version:** v1.0.0  
> **Last Updated:** 2026-07-20

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [Backup & Restore](#backup--restore)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** ≥ 18.x (LTS recommended)
- **npm** ≥ 9.x
- **Git** (for cloning the repository)
- **SQLite** (embedded via better-sqlite3 — no separate installation required)

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512 MB | 1 GB+ |
| Disk | 100 MB | 500 MB |
| OS | Linux, macOS, Windows | Linux (production) |

---

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/Jonhustleman/spyral-os.git
cd spyral-os
npm install
```

### 2. Build All Packages

```bash
npm run build
```

### 3. Start Development Server

```bash
npm run dev
```

The MCP server starts at `http://localhost:3001`.

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3001/health

# Readiness check
curl http://localhost:3001/ready

# System status
curl http://localhost:3001/status
```

Expected health response:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-20T...",
  "uptime": 123,
  "version": "1.0.0",
  "database": "connected"
}
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npx vitest --coverage

# Run specific test file
npx vitest src/test/architecture-compliance.test.ts
```

---

## Production Deployment

### Option 1: Direct Deployment

```bash
# 1. Build the project
npm run build

# 2. Set production environment
set NODE_ENV=production    # Windows
export NODE_ENV=production  # Linux/macOS

# 3. Start the server
npm run start
```

### Option 2: Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "spyral-os" -- run start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 3: Docker

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3001
CMD ["npm", "run", "start"]
```

Build and run:

```bash
docker build -t spyral-os .
docker run -d -p 3001:3001 --name spyral-os spyral-os
```

### Option 4: Vercel Deployment

The project includes a Next.js frontend that can be deployed to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

For the MCP server component, a separate server instance is required.

---

## Environment Configuration

### Configuration File

Create a `config.json` or set environment variables:

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  },
  "database": {
    "path": "./data/spyral.db"
  },
  "auth": {
    "sessionTimeout": 3600000,
    "jwtSecret": "your-secret-key"
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 100
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "backup": {
    "enabled": true,
    "interval": 86400000,
    "path": "./data/backups/"
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `localhost` |
| `DB_PATH` | SQLite database path | `./data/spyral.db` |
| `JWT_SECRET` | JWT signing secret | (random) |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Validation

Configuration is validated at startup using Zod schemas. Invalid configuration will log warnings but not prevent startup:

```
WARN [config-validator] Invalid configuration: ...
```

---

## Database Setup & Migrations

### Automatic Setup

The database is automatically created and migrated when the server starts:

```
INFO [migration] Running migrations...
INFO [migration] Migration 001 applied successfully
INFO [migration] Database ready
```

### Manual Migration

Migrations can be run manually:

```bash
node -e "
const { MigrationManager } = require('./packages/infrastructure');
const mm = new MigrationManager('./data/spyral.db');
mm.runMigrations();
"
```

### Migration Files

Migrations are stored in `packages/infrastructure/src/sql/migrations/`:

| File | Description |
|------|-------------|
| `001_initial.sql` | Core tables (decisions, workspaces, users, sessions) |
| `002_audit_trail.sql` | Audit log table |
| `003_patterns.sql` | Pattern storage table |

### Backup Database

```bash
# Copy the SQLite database file
copy data\spyral.db data\spyral.backup.db   # Windows
cp data/spyral.db data/spyral.backup.db      # Linux/macOS
```

---

## Backup & Restore

### Automated Backups

The system can be configured to create automatic backups:

```json
{
  "backup": {
    "enabled": true,
    "interval": 86400000,
    "path": "./data/backups/"
  }
}
```

### Manual Backup

```bash
curl -X POST http://localhost:3001/backup
```

### Restore from Backup

```javascript
const { restoreFromBackup } = require('@spyral-os/infrastructure');

// Restore database from backup file
restoreFromBackup('./data/backups/spyral-2026-07-20.db', './data/spyral.db');
```

### Backup Contents

Each backup includes:
- SQLite database file (compressed)
- File-based storage (workspace files, etc.)
- Metadata (timestamp, version, checksum)

---

## Monitoring & Health Checks

### Health Endpoints

| Endpoint | Method | Description | Rate Limited |
|----------|--------|-------------|-------------|
| `/health` | GET | Liveness probe — returns `{"status":"healthy"}` | No |
| `/ready` | GET | Readiness probe — checks database connectivity | No |
| `/status` | GET | Full system status with metrics | Yes |
| `/metrics` | GET | Request metrics summary | No |

### Metrics

The `/metrics` endpoint returns:

```json
{
  "totalRequests": 150,
  "requestsByMethod": {
    "GET": 100,
    "POST": 50
  },
  "requestsByRoute": {
    "/health": 20,
    "/status": 30,
    "/sse": 50,
    "/messages": 50
  },
  "averageDurationMs": 12.5,
  "errorCount": 2
}
```

### Logging

Structured JSON logging format:

```json
{
  "level": "info",
  "message": "Decision created",
  "correlationId": "abc-123",
  "timestamp": "2026-07-20T10:30:00.000Z",
  "data": {
    "decisionId": "dec_001",
    "status": "pending"
  }
}
```

---

## Troubleshooting

### Common Issues

#### Server fails to start

```
Error: listen EADDRINUSE :::3001
```

**Solution:** Port is already in use. Kill the existing process or change the port:

```bash
# Find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port
set PORT=3099
npm run start
```

#### Database connection error

```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:** Ensure the data directory exists and is writable:

```bash
mkdir data
```

#### Migration failures

```
Error: Migration 001 failed: table "decisions" already exists
```

**Solution:** Delete the database file and restart:

```bash
del data\spyral.db
npm run start
```

#### Empty terminal output (PowerShell)

If using PowerShell and commands return empty output:

```powershell
# Use explicit output formatting
curl.exe http://localhost:3001/health

# Or use Invoke-RestMethod
Invoke-RestMethod -Uri http://localhost:3001/health | ConvertTo-Json
```

---

## Security Considerations

1. **Change default secrets** — Set a strong `JWT_SECRET` in production
2. **Enable rate limiting** — Default limits may need tuning for your use case
3. **Use HTTPS** — Always use TLS in production (reverse proxy recommended)
4. **Regular backups** — Configure automated backups
5. **Audit logging** — All decisions and auth events are logged
6. **Input validation** — All inputs are validated with Zod schemas

---

## Performance Tuning

| Parameter | Recommendation |
|-----------|---------------|
| Rate limit | 100 req/min per client (adjust based on usage) |
| SQLite WAL mode | Enabled by default for better concurrency |
| Connection pooling | Not needed for SQLite (single connection) |
| Log level | `warn` in production, `debug` for troubleshooting |

---

*For additional support, please open an issue on GitHub.*
