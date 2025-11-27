# Flexoraa Backend - Quick Start Guide

This guide will help you get the Flexoraa backend running locally for development and testing.

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git** (for repo setup)
- **PostgreSQL client** (psql) for running migrations

## Setup Steps

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env - Phase 1 can run with stubs
# Set POSTGRES_PASSWORD to a secure value
# Leave other services with stub defaults for now
```

### 3. Start Services with Docker Compose

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

### 4. Run Database Migrations

**Windows:**
```cmd
cd scripts
migrate.bat up
```

**Linux/Mac:**
```bash
cd scripts
chmod +x migrate.sh
./migrate.sh up
```

### 5. (Optional) Seed Demo Data

```bash
psql -h localhost -U postgres -d flexoraa -f database/seeds/demo_data.sql
```

### 6. Verify Installation

Open your browser and visit:

- **API Health:** http://localhost:3000/health
- **Metrics:** http://localhost:3000/metrics
- **Grafana:** http://localhost:3001 (admin/admin)
- **Prometheus:** http://localhost:9090

### 7. Run Tests

```bash
cd api
npm test
```

## Development Workflow

### Running Locally (without Docker)

```bash
# Start Postgres and Redis manually, then:
cd api
npm run dev
```

### Linting

```bash
cd api
npm run lint         # Check
npm run lint:fix     # Auto-fix
```

### Database Management

```bash
# Reset database (WARNING: destructive!)
scripts/migrate.bat reset

# Run migrations manually
cd api
npm run migrate:up
```

## Testing with Postman

1. Import `postman_collection.json` into Postman
2. Set environment variables:
   - `base_url`: http://localhost:3000
   - `api_key`: (from demo data or create your own)
   - `jwt_token`: (generate via auth endpoint)
3. Run smoke tests

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env:
PORT=3001
GRAFANA_PORT=3002
```

### Database Connection Failed

```bash
# Check Postgres is running:
docker-compose ps postgres

# View logs:
docker-compose logs postgres
```

### Redis Connection Issues

```bash
# Restart Redis:
docker-compose restart redis
```

## Next Steps

- **Phase 2:** Add real API credentials to `.env`
- **Testing:** Run full test suite with `npm test`
- **Deployment:** See `docs/runbook.md` (Phase 6)

For more information, see the main [README.md](../README.md).
