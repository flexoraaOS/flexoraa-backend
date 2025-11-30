// Test script for Meta API webhook verification and message sending
// Run with: node test-meta-webhook.js
//
// This script tests:
// 1. Webhook verification (GET request)
// 2. Webhook message receiving (POST request simulation)
// 3. WhatsApp message sending
// 4. Instagram message sending
// 5. Facebook Messenger message sending

// Load environment variables from frontend/.env.local
require('dotenv').config({ path: './frontend/.env.local' });

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/meta`;
const VERIFY_TOKEN = 'flexoraa_webhook_verify_2024';
const API_KEY = process.env.FLEXORAA_API_KEY || 'your-api-key-here'; // Add to .env

// Test configuration - Will be auto-detected or use defaults
// TO GET REAL USER IDs:
// 1. WhatsApp: Use your own phone number in E.164 format (+91XXXXXXXXXX)
// 2. Instagram: Run 'node get-instagram-conversations.js' to get valid IGSID
// 3. Messenger: Run 'node test-facebook-messenger.js' to get valid PSID
//    Note: You can only message users who have messaged your Page (24h window)
let TEST_CONFIG = {
  userId: null,
  whatsapp: {
    to: '+919142409903',
  },
  instagram: {
    to: '703015062769112', // Updated business account ID
  },
  messenger: {
    to: '24306315295657859', // Valid PSID from existing conversation
  }
};

// ============================================
// 1. Test Webhook Verification (GET)
// ============================================
async function testWebhookVerification() {
  console.log('🔐 Testing Meta Webhook Verification (GET)...\n');

  try {
    const response = await fetch(
      `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge_12345`
    );

    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text}`);

    if (response.status === 200 && text === 'test_challenge_12345') {
      console.log('✅ Webhook verification successful!');
      console.log('   Your webhook is ready for Meta App configuration.\n');
      return true;
    } else if (response.status === 403) {
      console.log('❌ Webhook verification failed - Token mismatch');
      console.log('   Check your META_WEBHOOK_VERIFY_TOKEN environment variable.\n');
      return false;
    } else {
      console.log('❌ Webhook verification failed\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing webhook verification:', error.message, error.code, error.errno);
    return false;
  }
}

// ============================================
// 2. Test Webhook Message Receiving (POST)
// ============================================
async function testWebhookMessageReceiving() {
  console.log('📥 Testing Webhook Message Receiving (POST)...\n');

  // Sample WhatsApp webhook payload
  const whatsappPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: 'PHONE_NUMBER_ID'
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User'
                  },
                  wa_id: '15559876543'
                }
              ],
              messages: [
                {
                  from: '15559876543',
                  id: 'wamid.test123',
                  timestamp: Date.now().toString(),
                  text: {
                    body: 'Test message from webhook simulation'
                  },
                  type: 'text'
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload),
    });

    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text}`);

    if (response.status === 200) {
      console.log('✅ Webhook processed successfully!');
      console.log('   Check your database for new message entry.\n');
      return true;
    } else {
      console.log('❌ Webhook processing failed\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing webhook receiving:', error.message, error.code, error.errno);
    return false;
  }
}

// ============================================
// 3. Test WhatsApp Message Sending
// ============================================
async function testWhatsAppSending() {
  console.log('📱 Testing WhatsApp Message Sending...\n');

  const testData = {
    to: TEST_CONFIG.whatsapp.to,
    message: 'Hello from Flexoraa! 🚀 This is a test WhatsApp message.',
    userId: TEST_CONFIG.userId
  };

  console.log(`Sending to: ${testData.to}`);
  console.log(`User ID: ${testData.userId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/messages/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testData),
    });

    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      return true;
    } else {
      console.log('❌ WhatsApp message failed:', result.error, '\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing WhatsApp sending:', error.message, '\n');
    return false;
  }
}

// ============================================
// 4. Test Instagram Message Sending
// ============================================
async function testInstagramSending() {
  console.log('📷 Testing Instagram Message Sending...\n');

  const testData = {
    to: TEST_CONFIG.instagram.to,
    message: 'Hello from Flexoraa! 🚀 This is a test Instagram message.',
    userId: TEST_CONFIG.userId
  };

  console.log(`Sending to Instagram user: ${testData.to}`);
  console.log(`User ID: ${testData.userId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/messages/instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testData),
    });

    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Instagram message sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      return true;
    } else {
      console.log('❌ Instagram message failed:', result.error, '\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing Instagram sending:', error.message, '\n');
    return false;
  }
}

// ============================================
// 5. Test Facebook Messenger Sending
// ============================================
async function testMessengerSending() {
  console.log('💬 Testing Facebook Messenger Sending...\n');

  const testData = {
    to: TEST_CONFIG.messenger.to,
    message: 'Hello from Flexoraa! 🚀 This is a test Messenger message.',
    userId: TEST_CONFIG.userId
  };

  console.log(`Sending to Facebook user: ${testData.to}`);
  console.log(`User ID: ${testData.userId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/messages/messenger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testData),
    });

    console.log(`Status: ${response.status}`);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Messenger message sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      return true;
    } else {
      console.log('❌ Messenger message failed:', result.error, '\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing Messenger sending:', error.message, '\n');
    return false;
  }
}

// ============================================
// Auto-detect user with Meta credentials
// ============================================
async function findUserWithCredentials() {
  console.log('🔍 Checking for Meta credentials from environment...\n');

  try {
    // Since credentials are now from environment variables, we can use any user ID
    const response = await fetch(`${BASE_URL}/api/credentials?userId=test-user`);
    if (response.status === 200) {
      const data = await response.json();
      if (data.meta_access_token) {
        console.log('✅ Credentials available from environment variables');
        return 'test-user';
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch credentials from environment');
  }

  console.log('⚠️  No credentials available');
  console.log('   Please check your environment variables\n');
  return null;
}

// ============================================
// 6. Test Credentials Status
// ============================================
async function testCredentialsStatus() {
  console.log('🔑 Checking OAuth Credentials...\n');

  // First try to auto-detect user with credentials
  if (!TEST_CONFIG.userId || TEST_CONFIG.userId === 'your-user-uuid-here') {
    TEST_CONFIG.userId = await findUserWithCredentials();
  }

  if (!TEST_CONFIG.userId) {
    console.log('❌ No user ID available for testing');
    console.log('   Please complete Meta OAuth setup first.\n');
    return false;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/credentials?userId=${TEST_CONFIG.userId}`
    );

    if (response.status === 200) {
      const credentials = await response.json();

      if (credentials && credentials.meta_access_token) {
        console.log('✅ OAuth credentials found');
        console.log(`   Business Manager ID: ${credentials.business_manager_id || 'N/A'}`);
        console.log(`   Business Account ID: ${credentials.business_account_id || 'N/A'}`);
        console.log(`   Phone Number ID: ${credentials.phone_number_id || 'N/A'}`);
        console.log(`   Token: ${credentials.meta_access_token.substring(0, 20)}...`);
        console.log(`   Expires: ${credentials.token_expires_at || 'N/A'}\n`);
        return true;
      } else {
        console.log('⚠️  No credentials found for user');
        console.log('   Please complete OAuth flow first.\n');
        return false;
      }
    } else {
      console.log('❌ Failed to fetch credentials\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking credentials:', error.message, '\n');
    return false;
  }
}

// ============================================
// Main Test Runner
// ============================================
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Flexoraa Meta API Integration Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {
    verification: false,
    webhookReceiving: false,
    credentials: false,
    whatsapp: false,
    instagram: false,
    messenger: false,
  };

  // Test 1: Webhook Verification
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Webhook Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  results.verification = await testWebhookVerification();

  // Test 2: Webhook Message Receiving
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Webhook Message Receiving');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  results.webhookReceiving = await testWebhookMessageReceiving();

  // Test 3: Check Credentials
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: OAuth Credentials Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  results.credentials = await testCredentialsStatus();

  // Only run message sending tests if credentials exist
  if (results.credentials) {
    // Test 4: WhatsApp Sending
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: WhatsApp Message Sending');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    results.whatsapp = await testWhatsAppSending();

    // Test 5: Instagram Sending
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 5: Instagram Message Sending');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    results.instagram = await testInstagramSending();

    // Test 6: Messenger Sending
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 6: Facebook Messenger Sending');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    results.messenger = await testMessengerSending();
  } else {
    console.log('⚠️  Skipping message sending tests (no credentials found)\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`${results.verification ? '✅' : '❌'} Webhook Verification`);
  console.log(`${results.webhookReceiving ? '✅' : '❌'} Webhook Message Receiving`);
  console.log(`${results.credentials ? '✅' : '❌'} OAuth Credentials`);

  if (results.credentials) {
    console.log(`${results.whatsapp ? '✅' : '❌'} WhatsApp Message Sending`);
    console.log(`${results.instagram ? '✅' : '❌'} Instagram Message Sending`);
    console.log(`${results.messenger ? '✅' : '❌'} Facebook Messenger Sending`);
  }

  const totalTests = results.credentials ? 6 : 3;
  const passedTests = Object.values(results).filter(Boolean).length;

  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed\n`);

  // Next Steps
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 Next Steps');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!results.verification) {
    console.log('1. ❌ Fix webhook verification:');
    console.log('   - Set META_WEBHOOK_VERIFY_TOKEN environment variable');
    console.log('   - Make sure it matches your Meta App webhook settings\n');
  }

  if (!results.credentials) {
    console.log('2. ❌ Setup OAuth credentials:');
    console.log('   - Start your Next.js app: cd frontend && npm run dev');
    console.log('   - Navigate to http://localhost:3000/onboarding');
    console.log('   - Click "Connect with Meta" to complete OAuth flow');
    console.log('   - Update TEST_CONFIG.userId in this script\n');
  }

  if (results.credentials && (!results.whatsapp || !results.instagram || !results.messenger)) {
    console.log('3. ⚠️  Message sending failed:');
    console.log('   - Verify phone numbers and user IDs in TEST_CONFIG');
    console.log('   - Check Meta API permissions and token validity');
    console.log('   - Review error messages above for specific issues\n');
  }

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Meta API integration is working correctly.\n');
    console.log('4. Configure Meta App webhook URL:');
    console.log('   - Go to Meta Developer Dashboard');
    console.log('   - Set webhook URL to: https://yourdomain.com/api/webhooks/meta');
    console.log('   - Set verify token to match META_WEBHOOK_VERIFY_TOKEN');
    console.log('   - Subscribe to message events\n');

    console.log('5. Test with real users:');
    console.log('   - Send test messages from real WhatsApp/Instagram/Messenger accounts');
    console.log('   - Check database for incoming messages');
    console.log('   - Verify n8n workflows are triggered (if configured)\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test suite
runTests().catch(console.error);
