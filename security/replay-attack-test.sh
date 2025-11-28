#!/bin/bash
# Security Test: Webhook Replay Attack Prevention
# Verifies that duplicate webhook requests with same nonce are rejected

set -e

echo "🛡️ Testing webhook replay attack prevention..."

API_URL=${API_URL:-http://localhost:4000}
WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN:-test-verify-token}

# Generate unique nonce
NONCE="test-nonce-$(date +%s)"

echo "Test 1: Send webhook with nonce: $NONCE"

RESPONSE1=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha256=test-signature" \
  -H "X-Request-ID: $NONCE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "919876543210",
            "text": { "body": "Test message" },
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }')

HTTP_CODE1=$(echo "$RESPONSE1" | tail -1)
BODY1=$(echo "$RESPONSE1" | head -n -1)

echo "Response 1: HTTP $HTTP_CODE1"
echo "Body: $BODY1"

# Wait 1 second
sleep 1

echo ""
echo "Test 2: Resend same webhook (replay attack attempt)..."

RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha256=test-signature" \
  -H "X-Request-ID: $NONCE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "919876543210",
            "text": { "body": "Test message" },
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }')

HTTP_CODE2=$(echo "$RESPONSE2" | tail -1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

echo "Response 2: HTTP $HTTP_CODE2"
echo "Body: $BODY2"

# Verify
echo ""
echo "========================================="
echo "Replay Attack Prevention Test Summary"
echo "========================================="

if [[ "$HTTP_CODE1" =~ ^(200|201|202)$ ]] && [[ "$HTTP_CODE2" == "409" ]]; then
    echo "✅ PASS - First request accepted, replay rejected with 409 Conflict"
    exit 0
elif [[ "$HTTP_CODE2" == "409" ]]; then
    echo "✅ PASS - Replay attack blocked (409 Conflict)"
    exit 0
else
    echo "❌ FAIL - Replay attack not properly blocked"
    echo "Expected: HTTP 409 for duplicate request"
    echo "Got: HTTP $HTTP_CODE2"
    exit 1
fi
