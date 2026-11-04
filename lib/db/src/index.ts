import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const supabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL?.trim();
const databaseUrl = supabaseDatabaseUrl || process.env.DATABASE_URL?.trim();
const supabaseDatabaseCa = process.env.SUPABASE_DATABASE_CA_CERT?.trim();
const isProduction = process.env.NODE_ENV === "production";

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set.",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ...(supabaseDatabaseUrl
    ? {
        // Keep production certificate verification; the development preview
        // temporarily skips peer verification while retaining TLS encryption.
        ssl:
          isProduction && supabaseDatabaseCa
            ? { ca: supabaseDatabaseCa, rejectUnauthorized: true }
            : { rejectUnauthorized: false },
      }
    : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
