import { neon } from '@neondatabase/serverless';

// 1. Enforce strict environment variable validation at runtime
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL STARTUP FAILURE: DATABASE_URL environment variable is missing.");
}

// 2. Initialize the Neon serverless SQL connection
// This driver routes SQL over HTTP/WebSockets, preventing TCP connection exhaustion.
export const sql = neon(process.env.DATABASE_URL);