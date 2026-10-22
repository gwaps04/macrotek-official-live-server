// FILE: scripts/init-db.js
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

async function executeCleanSlate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[WOZ ERROR] DATABASE_URL is missing. Please check your environment variables.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    console.log('Initiating Macrotek Clean Slate Protocol...');

    // 1. Execute DDL Architecture
    const schemaPath = path.resolve('./schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing schema against: ${dbUrl.split('@')[1]}`);
    await client.query(schemaSql);
    console.log('SUCCESS: Architecture Built & Baseline Singletons Injected.');

    // 2. WOZ ZERO-LEAK CREDENTIAL HYDRATION
    // Safely reads admin credentials from environment or defaults to setup credentials
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@macrotek.com').trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMeOnFirstLogin2026!').trim();

    console.log(`Hydrating Administrator account: ${adminEmail}...`);

    // Parameterized Postgres pgcrypto blowfish hash injection (prevents SQL injection and log leaks)
    await client.query(
      `
      INSERT INTO admin_users (email, password_hash)
      VALUES ($1, crypt($2, gen_salt('bf', 10)))
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = crypt($2, gen_salt('bf', 10)), last_login = NULL
      `,
      [adminEmail, adminPassword]
    );

    console.log('SUCCESS: Administrator account hydrated securely.');
    if (!process.env.ADMIN_INITIAL_PASSWORD) {
      console.warn('⚠️ WARNING: ADMIN_INITIAL_PASSWORD was unset. Defaulted to "ChangeMeOnFirstLogin2026!". Update this in .env.local!');
    }
  } catch (error) {
    console.error('DATABASE HYDRATION FAILED:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeCleanSlate();