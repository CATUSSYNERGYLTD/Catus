import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const supabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL?.trim();
const databaseUrl = supabaseDatabaseUrl || process.env.DATABASE_URL?.trim();
const supabaseDatabaseCa = process.env.SUPABASE_DATABASE_CA_CERT?.trim();

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set.",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ...(supabaseDatabaseUrl
    ? {
        // Supabase CA was not supplied; keep TLS encryption while temporarily
        // skipping peer verification. Configure SUPABASE_DATABASE_CA_CERT to
        // restore certificate verification.
        ssl: supabaseDatabaseCa
          ? { ca: supabaseDatabaseCa, rejectUnauthorized: true }
          : { rejectUnauthorized: false },
      }
    : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
