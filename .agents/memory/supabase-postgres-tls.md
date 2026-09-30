---
name: Supabase PostgreSQL TLS verification
description: Certificate requirements for verified TLS connections to Supabase Postgres.
---

Supabase Postgres exposes a server root CA in Database settings. Use it with `sslmode=verify-full` and `sslrootcert`, or the driver's equivalent. `sslmode=require` encrypts traffic but does not verify the server identity.

**Why:** This workspace's Node PostgreSQL client rejected the Supabase pooler chain as `SELF_SIGNED_CERT_IN_CHAIN`; disabling verification would risk sending database credentials to an impersonated server.

**How to apply:** Obtain the CA from the authenticated Supabase project settings before migrating. Do not bypass certificate validation to make a connection work.