# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push schema changes to the configured primary database
- Required env: `SUPABASE_DATABASE_URL` (primary when set); `DATABASE_URL` is the Replit database fallback

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Supabase Postgres currently uses encrypted TLS without certificate verification because its root CA was not supplied. Set `SUPABASE_DATABASE_CA_CERT` to restore peer verification.
- Declare row-level security with Drizzle `.enableRLS()` on Supabase-backed tables; schema pushes can change the table's RLS state to match the Drizzle definition.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
