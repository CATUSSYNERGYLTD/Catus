---
name: Supabase PostgreSQL TLS verification
description: Certificate requirements for verified TLS connections to Supabase Postgres.
---

Supabase Postgres exposes a server root CA in Database settings. Use it with `sslmode=verify-full` and `sslrootcert`, or the driver's equivalent. `sslmode=require` encrypts traffic but does not verify the server identity.

**Why:** This workspace's Node PostgreSQL client rejected the Supabase pooler chain as `SELF_SIGNED_CERT_IN_CHAIN`; disabling verification would risk sending database credentials to an impersonated server.

**How to apply:** Prefer the CA from authenticated Supabase project settings. If the project owner explicitly directs continuing without it after the risk is explained, keep TLS encryption on, document the exception, and restore certificate verification when the CA becomes available.