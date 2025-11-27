#!/bin/bash

# Deployment Script for n8n Production Backend
# Deploys/updates the application on Hetzner VPS

set -e

APP_DIR="/opt/n8n-backend"
BACKUP_DIR="/opt/n8n-backend-backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting deployment..."

# Backup current deployment
if [ -d "$APP_DIR" ]; then
    echo "💾 Backing up current deployment..."
    sudo cp -r $APP_DIR $BACKUP_DIR
fi

# Pull latest changes (if using Git)
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Pulling latest changes..."
    cd $APP_DIR
    git pull origin main
fi

# Build Docker images
echo "🐳 Building Docker images..."
cd $APP_DIR/infrastructure/docker-compose
docker-compose -f docker-compose.production.yml build --no-cache

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm postgres psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -f /docker-entrypoint-initdb.d/001_initial_schema.sql || true

# Start services with rolling update
echo "🔄 Deploying services..."
docker-compose -f docker-compose.production.yml up -d --remove-orphans

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health check
echo "🏥 Running health checks..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ API health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Health check failed after $MAX_RETRIES attempts"
    echo "🔙 Rolling back to previous version..."
    
    # Rollback
    docker-compose -f docker-compose.production.yml down
    sudo rm -rf $APP_DIR
    sudo mv $BACKUP_DIR $APP_DIR
    cd $APP_DIR/infrastructure/docker-compose
    docker-compose -f docker-compose.production.yml up -d
    
    echo "❌ Deployment failed and rolled back"
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "📊 View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "📈 Grafana: https://api.flexoraaa.com/grafana"
echo "🔧 n8n: https://api.flexoraaa.com/n8n"
