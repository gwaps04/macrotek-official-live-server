import { neon } from '@neondatabase/serverless';

async function testConnection() {
  console.log("\n========================================");
  console.log("   WOZ DIAGNOSTIC: NEON DB CONNECTION   ");
  console.log("========================================\n");

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ FATAL: DATABASE_URL is completely missing from the environment.");
    console.error("👉 Fix: Ensure .env.local is in the root directory and properly formatted.");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL loaded into memory.");
  console.log(`🔗 Target Endpoint: ${dbUrl.split('@')[1].split('/')[0]}\n`);
  console.log("🔄 Initiating HTTP/WebSocket connection to Neon...");

  const sql = neon(dbUrl);

  try {
    // We run the most basic, foolproof query possible
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    console.log("✅ SUCCESS! TCP/HTTP Pipeline is open.");
    console.log(`⏱️  Neon Server Time: ${result[0].current_time}`);
    console.log(`🐘 Engine: ${result[0].pg_version}\n`);
    
  } catch (error) {
    console.error("\n❌ CONNECTION FAILED. Neon rejected the request.");
    console.error(`Reason: ${error.message}`);
  }
}

testConnection();