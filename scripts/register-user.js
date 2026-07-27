#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return {};

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  });

  return env;
}

async function main() {
  const env = loadEnv();
  const email = process.argv[2] || env.SUPABASE_SIGNUP_EMAIL || 'th0935057511@gmail.com';
  const password = process.argv[3] || env.SUPABASE_SIGNUP_PASSWORD || '12345678';

  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`🚀 Creating Supabase account for ${email}...`);
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error('❌ Sign-up failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Account registration request sent successfully.');
  console.log(JSON.stringify({
    user: data.user,
    session: data.session,
    confirmationSent: data.user?.email_confirmed_at === null
  }, null, 2));
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
