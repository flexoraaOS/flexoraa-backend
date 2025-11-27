#!/bin/bash
# Migration Runner Script
# Runs all PostgreSQL migrations in order
# Usage: ./migrate.sh [up|down|reset]

set -e

# Configuration
MIGRATIONS_DIR="$(dirname "$0")/../database/migrations"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-flexoraa}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql is not installed"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "🔄 Migration Runner - Flexoraa Backend"
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "---"

# Function to run a migration file
run_migration() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "📝 Running migration: $filename"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    
    if [ $? -eq 0 ]; then
        echo "✅ $filename completed successfully"
    else
        echo "❌ $filename failed"
        exit 1
    fi
}

# Function to run all migrations
migrate_up() {
    echo "⬆️  Running migrations UP..."
    
    for file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$file" ]; then
            run_migration "$file"
        fi
    done
    
    echo "✅ All migrations completed successfully!"
}

# Function to drop all tables (destructive!)
migrate_down() {
    echo "⚠️  WARNING: This will DROP all tables!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Aborted"
        exit 0
    fi
    
    echo "⬇️  Running migrations DOWN (dropping all tables)..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
DROP TABLE IF EXISTS chat_memory CASCADE;
DROP TABLE IF EXISTS assignment_queue CASCADE;
DROP TABLE IF EXISTS webhook_raw CASCADE;
DROP TABLE IF EXISTS lead_audit CASCADE;
DROP TABLE IF EXISTS consent_log CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS prevent_consent_log_modification CASCADE;
DROP FUNCTION IF EXISTS get_latest_consent CASCADE;
DROP FUNCTION IF EXISTS log_lead_changes CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_webhook_request CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_webhooks CASCADE;
DROP FUNCTION IF EXISTS increment_assignment_version CASCADE;
DROP FUNCTION IF EXISTS assign_next_lead_to_sdr CASCADE;
DROP FUNCTION IF EXISTS requeue_assignment CASCADE;
DROP FUNCTION IF EXISTS get_chat_history CASCADE;
DROP FUNCTION IF EXISTS add_chat_message CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_chat_memory CASCADE;

-- Drop views
DROP VIEW IF EXISTS current_consent_status CASCADE;
DROP VIEW IF EXISTS chat_token_usage CASCADE;

EOF
    
    echo "✅ All tables dropped"
}

# Function to reset (down + up)
migrate_reset() {
    echo "🔄 Resetting database (DOWN + UP)..."
    migrate_down
    migrate_up
}

# Main logic
case "${1:-up}" in
    up)
        migrate_up
        ;;
    down)
        migrate_down
        ;;
    reset)
        migrate_reset
        ;;
    *)
        echo "Usage: $0 [up|down|reset]"
        echo "  up    - Run all migrations"
        echo "  down  - Drop all tables (destructive!)"
        echo "  reset - Drop and recreate all tables"
        exit 1
        ;;
esac

# Unset password
unset PGPASSWORD

exit 0
