import { defineConfig } from "drizzle-kit";
import path from "path";

const supabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL?.trim();
const databaseUrl = supabaseDatabaseUrl || process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");
}

const configuredDatabaseUrl = (() => {
  if (!supabaseDatabaseUrl) return databaseUrl;
  const url = new URL(supabaseDatabaseUrl);
  // Encrypted transport without CA verification until the project CA is set.
  url.searchParams.set("sslmode", "require");
  return url.toString();
})();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: configuredDatabaseUrl,
  },
});
