import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
// dotenv import removed! Native Node will handle it.

async function executeCleanSlate() {
  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Initiating Macrotek Clean Slate Protocol...");
    
    const schemaPath = path.resolve('./schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Executing schema against: ${process.env.DATABASE_URL.split('@')[1]}`);
    
    await client.query(schemaSql);
    
    console.log("SUCCESS: Architecture Nuked and Rebuilt.");
    console.log("Seed singletons injected. You may now log in.");

  } catch (error) {
    console.error("DATABASE HYDRATION FAILED:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

executeCleanSlate();