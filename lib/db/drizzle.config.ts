import { defineConfig } from "drizzle-kit";
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "path";

const supabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL?.trim();
const supabaseDatabaseCa = process.env.SUPABASE_DATABASE_CA_CERT?.trim();
const databaseUrl = supabaseDatabaseUrl || process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");
}

const configuredDatabaseUrl = (() => {
  if (!supabaseDatabaseUrl) return databaseUrl;
  const url = new URL(supabaseDatabaseUrl);
  if (supabaseDatabaseCa) {
    const caPath = path.join(os.tmpdir(), "supabase-database-ca.pem");
    writeFileSync(caPath, supabaseDatabaseCa, { mode: 0o600 });
    url.searchParams.set("sslmode", "verify-full");
    url.searchParams.set("sslrootcert", caPath);
    url.searchParams.delete("uselibpqcompat");
  } else {
    // pg-connection-string otherwise treats "require" as "verify-full".
    // Keep TLS encryption while skipping peer verification until the CA is set.
    url.searchParams.set("sslmode", "require");
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
})();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: configuredDatabaseUrl,
  },
});
