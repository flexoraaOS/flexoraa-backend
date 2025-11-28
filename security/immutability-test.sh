#!/bin/bash
# Security Test: Consent Log Immutability
# Verifies that consent_log table is append-only (cannot UPDATE or DELETE)

set -e

echo "🔐 Testing consent_log immutability..."

# Database connection (use environment variables)
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-flexoraa}
DB_USER=${DATABASE_USER:-flexoraa_admin}

# Test 1: Try to UPDATE a consent_log record
echo "Test 1: Attempting UPDATE on consent_log (should fail)..."

UPDATE_RESULT=$(psql "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -c "
UPDATE consent_log 
SET consent_status = 'modified' 
WHERE id = (SELECT id FROM consent_log LIMIT 1);
" 2>&1 || true)

if echo "$UPDATE_RESULT" | grep -q "permission denied\|trigger\|immutable"; then
    echo "✅ UPDATE blocked correctly"
    TEST1_PASS=true
else
    echo "❌ UPDATE was allowed (SECURITY VIOLATION)"
    TEST1_PASS=false
fi

# Test 2: Try to DELETE a consent_log record
echo "Test 2: Attempting DELETE on consent_log (should fail)..."

DELETE_RESULT=$(psql "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -c "
DELETE FROM consent_log 
WHERE id = (SELECT id FROM consent_log LIMIT 1);
" 2>&1 || true)

if echo "$DELETE_RESULT" | grep -q "permission denied\|trigger\|immutable"; then
    echo "✅ DELETE blocked correctly"
    TEST2_PASS=true
else
    echo "❌ DELETE was allowed (SECURITY VIOLATION)"
    TEST2_PASS=false
fi

# Test 3: INSERT should still work
echo "Test 3: Attempting INSERT on consent_log (should succeed)..."

INSERT_RESULT=$(psql "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -c "
INSERT INTO consent_log (tenant_id, phone_number, phone_hash, consent_type, consent_status, consent_method, ip_address)
VALUES ('test-tenant', 'encrypted-phone', 'hash-value', 'whatsapp', 'opt-in', 'webhook', '192.168.1.1')
RETURNING id;
" 2>&1)

if echo "$INSERT_RESULT" | grep -q "INSERT 0 1"; then
    echo "✅ INSERT works correctly"
    TEST3_PASS=true
else
    echo "❌ INSERT failed (should be allowed)"
    TEST3_PASS=false
fi

# Summary
echo ""
echo "========================================="
echo "Consent Log Immutability Test Summary"
echo "========================================="
echo "UPDATE blocked: $([ "$TEST1_PASS" = true ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "DELETE blocked: $([ "$TEST2_PASS" = true ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "INSERT allowed: $([ "$TEST3_PASS" = true ] && echo '✅ PASS' || echo '❌ FAIL')"

if [ "$TEST1_PASS" = true ] && [ "$TEST2_PASS" = true ] && [ "$TEST3_PASS" = true ]; then
    echo ""
    echo "✅ ALL TESTS PASSED - consent_log is immutable"
    exit 0
else
    echo ""
    echo "❌ TESTS FAILED - consent_log immutability violated"
    exit 1
fi
