---
name: GitHub push authentication from Replit
description: Prefer Replit's connected GitHub credential path for repository pushes instead of overriding it with a personal token.
---

After GitHub is connected to Replit, a standard `git push` to the repository URL can use Replit's credential proxy. Supplying a personal token through `GIT_ASKPASS` bypasses that path and authenticates as the token's GitHub user; a 403 names that authenticated user, not the push destination.

**Why:** In this workspace, the token-authenticated push was denied, while the standard Replit Git push succeeded to the same repository and existing branch.

**How to apply:** Prefer the standard Git credential flow after connecting GitHub. Push only the intended repository and existing branch; do not force-push or create another branch.
