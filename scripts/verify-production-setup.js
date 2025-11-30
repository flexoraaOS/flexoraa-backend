#!/usr/bin/env node

/**
 * Flexoraa Production Setup Verification Script
 * 
 * This script checks if all required environment variables are set
 * and validates the production configuration.
 * 
 * Usage: node scripts/verify-production-setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Required environment variables
const requiredEnvVars = {
  supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  meta: [
    'NEXT_PUBLIC_META_APP_ID',
    'META_APP_SECRET',
    'META_ACCESS_TOKEN',
    'META_WHATSAPP_PHONE_NUMBER_ID',
    'META_WEBHOOK_VERIFY_TOKEN',
  ],
  ai: [
    'GOOGLE_API_KEY',
  ],
  payment: [
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
  ],
  email: [
    'RESEND_API_KEY', // OR GMAIL_USER and GMAIL_APP_PASSWORD
  ],
  n8n: [
    'NEXT_PUBLIC_N8N_WEBHOOK_URL',
    'N8N_WHATSAPP_MESSAGE_WEBHOOK',
    'N8N_INSTAGRAM_MESSAGE_WEBHOOK',
    'N8N_FACEBOOK_MESSAGE_WEBHOOK',
  ],
};

// Optional but recommended environment variables
const optionalEnvVars = [
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'NEXT_PUBLIC_N8N_COMPANY_DETAIL_WEBHOOK_URL',
  'META_WHATSAPP_BUSINESS_NUMBER',
];

// Placeholder values that should be replaced
const placeholders = [
  'your-meta-app-secret-here',
  'your-service-role-key-here',
  'your-meta-access-token-here',
  'your-whatsapp-phone-number-id-here',
  'your_razorpay_key_id',
  'your_razorpay_key_secret',
  'your_razorpay_webhook_secret',
  'your_google_ai_api_key_here',
  'your_resend_api_key_here',
  'your-n8n-instance',
  'yourdomain.com',
  'localhost:3000',
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('\n❌ ERROR: .env.local file not found!', 'red');
    log('\n📝 Please create .env.local from .env.production.example:', 'yellow');
    log('   cp .env.production.example .env.local\n', 'cyan');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function checkEnvVar(key, value) {
  if (!value) {
    log(`  ❌ ${key}: NOT SET`, 'red');
    return false;
  }
  
  // Check for placeholder values
  const hasPlaceholder = placeholders.some(placeholder => 
    value.toLowerCase().includes(placeholder.toLowerCase())
  );
  
  if (hasPlaceholder) {
    log(`  ⚠️  ${key}: PLACEHOLDER VALUE (needs to be replaced)`, 'yellow');
    return false;
  }
  
  // Check for suspiciously short values (except for test/demo values)
  if (value.length < 10 && !key.includes('APP_ID')) {
    log(`  ⚠️  ${key}: Suspiciously short value`, 'yellow');
    return false;
  }
  
  log(`  ✅ ${key}: OK`, 'green');
  return true;
}

function verifyCategory(categoryName, envVars, env) {
  log(`\n🔍 Checking ${categoryName}:`, 'cyan');
  
  let allValid = true;
  envVars.forEach(key => {
    const isValid = checkEnvVar(key, env[key]);
    if (!isValid) allValid = false;
  });
  
  return allValid;
}

function checkEmailConfig(env) {
  log('\n🔍 Checking Email Configuration:', 'cyan');
  
  const hasResend = env.RESEND_API_KEY && 
    !placeholders.some(p => env.RESEND_API_KEY.toLowerCase().includes(p.toLowerCase()));
  
  const hasGmail = env.GMAIL_USER && env.GMAIL_APP_PASSWORD;
  
  if (hasResend) {
    log('  ✅ Resend configured', 'green');
    return true;
  } else if (hasGmail) {
    log('  ✅ Gmail SMTP configured', 'green');
    return true;
  } else {
    log('  ❌ No email service configured (need Resend OR Gmail)', 'red');
    return false;
  }
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 PRODUCTION READINESS REPORT', 'blue');
  log('='.repeat(60), 'blue');
  
  const categories = Object.keys(results);
  const passed = categories.filter(cat => results[cat]).length;
  const total = categories.length;
  
  categories.forEach(category => {
    const status = results[category] ? '✅' : '❌';
    const color = results[category] ? 'green' : 'red';
    log(`${status} ${category.toUpperCase()}`, color);
  });
  
  log('\n' + '-'.repeat(60), 'blue');
  log(`Overall: ${passed}/${total} categories ready`, 'cyan');
  log('-'.repeat(60) + '\n', 'blue');
  
  if (passed === total) {
    log('🎉 SUCCESS! All required configurations are set!', 'green');
    log('\n📋 Next Steps:', 'cyan');
    console.log('   1. Run database migration: PRODUCTION_SETUP_COMPLETE.sql');
    console.log('   2. Set up Meta webhooks');
    console.log('   3. Import n8n workflows');
    console.log('   4. Run: npm run build');
    console.log('   5. Deploy to Vercel\n');
    return true;
  } else {
    log('⚠️  WARNING: Some configurations are missing!', 'yellow');
    log('\n📋 Action Required:', 'cyan');
    console.log('   1. Review the errors above');
    console.log('   2. Update .env.local with correct values');
    console.log('   3. See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed setup');
    console.log('   4. Run this script again to verify\n');
    return false;
  }
}

function checkDatabaseMigration() {
  log('\n🔍 Checking Database Migration File:', 'cyan');
  
  const migrationPath = path.join(__dirname, '..', 'PRODUCTION_SETUP_COMPLETE.sql');
  
  if (fs.existsSync(migrationPath)) {
    log('  ✅ Migration file exists', 'green');
    log('  📝 Run this in Supabase SQL Editor', 'yellow');
    return true;
  } else {
    log('  ❌ Migration file not found', 'red');
    return false;
  }
}

function checkDocumentation() {
  log('\n🔍 Checking Documentation:', 'cyan');
  
  const docs = [
    'PRODUCTION_DEPLOYMENT_GUIDE.md',
    'PRODUCTION_CHECKLIST.md',
    '.env.production.example',
  ];
  
  let allExist = true;
  docs.forEach(doc => {
    const docPath = path.join(__dirname, '..', doc);
    if (fs.existsSync(docPath)) {
      log(`  ✅ ${doc} exists`, 'green');
    } else {
      log(`  ❌ ${doc} missing`, 'red');
      allExist = false;
    }
  });
  
  return allExist;
}

// Main execution
function main() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🚀 FLEXORAA PRODUCTION SETUP VERIFICATION', 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
  
  // Load environment variables
  const env = loadEnvFile();
  
  // Check each category
  const results = {
    supabase: verifyCategory('Supabase', requiredEnvVars.supabase, env),
    meta: verifyCategory('Meta/Facebook', requiredEnvVars.meta, env),
    ai: verifyCategory('Google AI', requiredEnvVars.ai, env),
    payment: verifyCategory('Razorpay Payment', requiredEnvVars.payment, env),
    email: checkEmailConfig(env),
    n8n: verifyCategory('N8N Workflows', requiredEnvVars.n8n, env),
  };
  
  // Check database migration
  checkDatabaseMigration();
  
  // Check documentation
  checkDocumentation();
  
  // Generate final report
  const success = generateReport(results);
  
  process.exit(success ? 0 : 1);
}

main();
