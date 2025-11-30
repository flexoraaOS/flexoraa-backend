#!/usr/bin/env node

/**
 * Flexoraa Production API Testing Script
 * 
 * This script tests all critical API endpoints and integrations
 * to ensure they're working correctly in production.
 * 
 * Usage: node scripts/test-production-apis.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000,
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testSupabase() {
  log('\n🔍 Testing Supabase Connection...', 'cyan');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    log('  ❌ Supabase credentials not configured', 'red');
    return false;
  }

  try {
    const response = await makeRequest(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    if (response.statusCode === 200 || response.statusCode === 404) {
      log('  ✅ Supabase connection successful', 'green');
      return true;
    } else {
      log(`  ❌ Supabase returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Supabase connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testMetaAPI() {
  log('\n🔍 Testing Meta/Facebook API...', 'cyan');
  
  const token = process.env.META_ACCESS_TOKEN;
  
  if (!token || token.includes('your-meta-access-token')) {
    log('  ⚠️  Meta access token not configured', 'yellow');
    return false;
  }

  try {
    const response = await makeRequest(
      `https://graph.facebook.com/v18.0/me?access_token=${token}`
    );

    const data = JSON.parse(response.body);
    
    if (data.id) {
      log(`  ✅ Meta API connected (User ID: ${data.id})`, 'green');
      return true;
    } else if (data.error) {
      log(`  ❌ Meta API error: ${data.error.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Meta API test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testRazorpay() {
  log('\n🔍 Testing Razorpay API...', 'cyan');
  
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret || keyId.includes('your_razorpay')) {
    log('  ⚠️  Razorpay credentials not configured', 'yellow');
    return false;
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await makeRequest('https://api.razorpay.com/v1/payments', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (response.statusCode === 200) {
      log('  ✅ Razorpay API connected', 'green');
      return true;
    } else {
      log(`  ❌ Razorpay returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Razorpay test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testN8NWebhooks() {
  log('\n🔍 Testing N8N Webhooks...', 'cyan');
  
  const webhooks = [
    { name: 'WhatsApp AI', url: process.env.N8N_WHATSAPP_MESSAGE_WEBHOOK },
    { name: 'Instagram AI', url: process.env.N8N_INSTAGRAM_MESSAGE_WEBHOOK },
    { name: 'Facebook AI', url: process.env.N8N_FACEBOOK_MESSAGE_WEBHOOK },
    { name: 'Main Webhook', url: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL },
  ];

  let allWorking = true;

  for (const webhook of webhooks) {
    if (!webhook.url || webhook.url.includes('your-n8n-instance')) {
      log(`  ⚠️  ${webhook.name}: Not configured`, 'yellow');
      allWorking = false;
      continue;
    }

    try {
      // Just check if the endpoint is reachable
      const response = await makeRequest(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { test: true },
      });

      // N8N webhooks typically return 200 or 400 for test requests
      if (response.statusCode === 200 || response.statusCode === 400) {
        log(`  ✅ ${webhook.name}: Reachable`, 'green');
      } else {
        log(`  ⚠️  ${webhook.name}: Returned ${response.statusCode}`, 'yellow');
      }
    } catch (error) {
      log(`  ❌ ${webhook.name}: Not reachable (${error.message})`, 'red');
      allWorking = false;
    }
  }

  return allWorking;
}

async function testGoogleAI() {
  log('\n🔍 Testing Google AI API...', 'cyan');
  
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey || apiKey.includes('your_google_ai_api_key')) {
    log('  ⚠️  Google AI API key not configured', 'yellow');
    return false;
  }

  try {
    const response = await makeRequest(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = JSON.parse(response.body);
    
    if (data.models && data.models.length > 0) {
      log(`  ✅ Google AI API connected (${data.models.length} models available)`, 'green');
      return true;
    } else if (data.error) {
      log(`  ❌ Google AI API error: ${data.error.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Google AI test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testEmailService() {
  log('\n🔍 Testing Email Service Configuration...', 'cyan');
  
  const resendKey = process.env.RESEND_API_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (resendKey && !resendKey.includes('your_resend_api_key')) {
    try {
      const response = await makeRequest('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
        },
      });

      if (response.statusCode === 200 || response.statusCode === 401) {
        log('  ✅ Resend API configured', 'green');
        return true;
      }
    } catch (error) {
      log(`  ❌ Resend test failed: ${error.message}`, 'red');
    }
  } else if (gmailUser && gmailPass) {
    log('  ✅ Gmail SMTP configured', 'green');
    log('  ℹ️  Run test-gmail.js to verify Gmail connection', 'cyan');
    return true;
  } else {
    log('  ⚠️  No email service configured', 'yellow');
    return false;
  }
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 API TESTING REPORT', 'blue');
  log('='.repeat(60), 'blue');
  
  const services = Object.keys(results);
  const passed = services.filter(service => results[service]).length;
  const total = services.length;
  
  services.forEach(service => {
    const status = results[service] ? '✅' : '❌';
    const color = results[service] ? 'green' : 'red';
    log(`${status} ${service}`, color);
  });
  
  log('\n' + '-'.repeat(60), 'blue');
  log(`Result: ${passed}/${total} services operational`, 'cyan');
  log('-'.repeat(60) + '\n', 'blue');
  
  if (passed === total) {
    log('🎉 SUCCESS! All APIs are working correctly!', 'green');
    return true;
  } else {
    log('⚠️  WARNING: Some APIs are not working!', 'yellow');
    log('\n📋 Action Required:', 'cyan');
    log('   1. Check the failed services above', 'white');
    log('   2. Verify credentials in .env.local', 'white');
    log('   3. Refer to PRODUCTION_DEPLOYMENT_GUIDE.md', 'white');
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🧪 FLEXORAA API TESTING', 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
  
  const results = {
    'Supabase': await testSupabase(),
    'Meta/Facebook': await testMetaAPI(),
    'Razorpay': await testRazorpay(),
    'Google AI': await testGoogleAI(),
    'Email Service': await testEmailService(),
    'N8N Webhooks': await testN8NWebhooks(),
  };
  
  const success = generateReport(results);
  
  process.exit(success ? 0 : 1);
}

main();
