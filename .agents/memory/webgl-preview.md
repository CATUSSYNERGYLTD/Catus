---
name: WebGL preview limits
description: Limits of the Replit screenshot browser when validating Three.js WebGL output.
---

The Replit screenshot browser in this workspace could not create a WebGL context. A software-rendered fallback kept the 3D rig visible in preview, but that screenshot does not confirm how the GPU-rendered Three.js path looks on a WebGL-capable browser.

**Why:** The browser reported that it could not create a WebGL context even though the app and Three.js code loaded successfully.

**How to apply:** When reviewing this app's gorilla visuals, distinguish the Canvas 2D software fallback from the WebGL path and arrange a GPU-enabled browser check before judging final WebGL appearance.