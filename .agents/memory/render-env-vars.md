---
name: Render environment variable updates
description: Preserve the full service environment when changing Render configuration.
---

Render's service environment-variable `PUT` replaces the complete variable list rather than updating only the keys in the request. A one-key request can silently remove database credentials and runtime settings, causing production failures.

**Why:** A session-secret rotation using a partial list removed the other service variables and broke the database-backed API until the full required set was restored.

**How to apply:** Before using `PUT`, enumerate every required service variable and send the complete intended set. Afterward, verify key names (never values), deploy, and check health plus the affected authenticated flow.
