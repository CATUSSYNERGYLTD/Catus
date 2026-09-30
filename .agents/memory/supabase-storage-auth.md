---
name: Supabase Storage REST authentication
description: Header requirements for direct Supabase Storage REST administration with modern API keys.
---

For direct Storage REST administration, send a modern `sb_secret_...` key in the `apikey` header, never as `Authorization: Bearer`. Storage admin routes also require a valid JWT bearer; pair the secret API key with a legacy `service_role` JWT in `Authorization` when the app's own admin session is not a Supabase Auth token. A missing bucket may be reported as HTTP 400 with code `NoSuchBucket`.

**Why:** Supabase's modern API keys are not JWTs. Sending one as a bearer token produces `Invalid Compact JWS`, and the API key alone was denied for bucket creation.

**How to apply:** Keep the secret API key and JWT in separate server-only settings, use the key only for `apikey`, and use the JWT only for `Authorization`.