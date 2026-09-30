---
name: Render pnpm build commands
description: Render's managed Node build image can expose pnpm through a read-only system shim.
---

Use the installed `pnpm` command directly in Render native Node build commands. Avoid `corepack enable` when it tries to replace the existing pnpm shim.

**Why:** On this workspace's Render build, Corepack failed with `EROFS` while unlinking `/usr/bin/pnpm`; the image already provided a working pnpm command.

**How to apply:** For future Render builds of this pnpm workspace, run `pnpm install` and the package scripts directly. Do not add `corepack enable` unless the build image changes and the shim is writable.