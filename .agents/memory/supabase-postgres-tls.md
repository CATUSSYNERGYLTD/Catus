---
name: Supabase PostgreSQL TLS verification
description: Certificate requirements for verified TLS connections to Supabase Postgres.
---

Supabase Postgres exposes a server root CA in Database settings. Use it with `sslmode=verify-full` and `sslrootcert`, or the driver's equivalent. `sslmode=require` encrypts traffic but does not verify the server identity.

**Why:** This workspace's Node PostgreSQL client rejected the Supabase pooler chain as `SELF_SIGNED_CERT_IN_CHAIN`; disabling verification would risk sending database credentials to an impersonated server.

**How to apply:** Prefer the CA from authenticated Supabase project settings. If the project owner explicitly directs continuing without it after the risk is explained, keep TLS encryption on, document the exception, and restore certificate verification when the CA becomes available.

**Why:** A configured CA secret can still fail to validate the active database endpoint; secret presence alone does not prove it is the matching root certificate.

**How to apply:** Before external database DDL, verify the endpoint with the configured CA. If verification fails, obtain the matching CA unless the owner explicitly authorizes an unverified, encrypted one-off connection.

**Why:** After the owner authorized a one-time encrypted connection without peer verification, the configured URI still failed at hostname resolution, showing that a present secret can also contain an unusable endpoint.

**How to apply:** Treat DNS or pooler tenant errors as connection-URI issues, not TLS issues. Stop before DDL and correct the URI through the secure secrets flow instead of continuing to change TLS settings.

**Development exception:** At the owner's request, the local API preview keeps TLS encryption but skips peer verification; production continues to verify the configured CA.

**Why:** The supplied CA did not validate the endpoint, and the preview needed to use the corrected database URI.

**How to apply:** Keep this exception development-only and restore verification in preview when the matching CA is available.

**Project exception:** On 2026-09-30, after the risk was explained, the owner directed proceeding with the Render deployment without requiring the Supabase root CA.

**Why:** Deployment should proceed as directed, but without peer verification the database identity is not authenticated.

**How to apply:** For this Render service, keep TLS encryption enabled and omit the CA setting unless the owner later asks to use it. Do not describe this connection as certificate-verified; restore verification when the owner approves configuring the CA.