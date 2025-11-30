#!/usr/bin/env node

/**
 * Run Supabase Migration Script
 *
 * This script executes SQL migrations against the Supabase database
 * using the service role key for direct database access.
 *
 * Usage: node scripts/run-migration.js <migration-file>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from frontend/.env.local
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

async function runMigration(migrationFile) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    log('❌ Missing Supabase credentials. Check .env.local', 'red');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    log(`🔄 Reading migration file: ${migrationFile}`, 'cyan');

    if (!fs.existsSync(migrationFile)) {
      log(`❌ Migration file not found: ${migrationFile}`, 'red');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');

    log('🚀 Executing migration...', 'yellow');

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            log(`⚠️  Statement failed: ${statement.substring(0, 50)}...`, 'yellow');
            log(`   Error: ${error.message}`, 'red');
            // Continue with other statements
          }
        } catch (err) {
          log(`⚠️  Statement failed: ${statement.substring(0, 50)}...`, 'yellow');
          log(`   Error: ${err.message}`, 'red');
        }
      }
    }

    // For complex migrations, try executing as a single query
    log('🔄 Executing migration as single query...', 'cyan');

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      log(`❌ Migration failed: ${error.message}`, 'red');
      log('💡 Try running individual statements or check the SQL syntax', 'yellow');
      process.exit(1);
    }

    log('✅ Migration completed successfully!', 'green');

    if (data) {
      log('📊 Results:', 'blue');
      console.log(data);
    }

  } catch (error) {
    log(`❌ Migration execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    log('Usage: node scripts/run-migration.js <migration-file>', 'yellow');
    log('Example: node scripts/run-migration.js supabase/migrations/20251116000000_final_schema_verification.sql', 'cyan');
    process.exit(1);
  }

  const migrationFile = path.resolve(args[0]);
  runMigration(migrationFile);
}

main();</content>
<parameter name="filePath">c:\Users\addy\Downloads\flexoraa\scripts\run-migration.js