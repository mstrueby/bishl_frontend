---
name: Replit Nix cache mismatch
description: Environment-specific guidance for stale Replit Nix layers after runtime or toolchain changes.
---

When a publish error names a corrupt Nix store path whose runtime/tool version is absent from the current project, treat it as stale or corrupted Replit environment state before changing application dependencies.

**Why:** The workspace cache can retain an older generated environment after `.replit` modules or the Nix channel change. A layer hash mismatch is a content-integrity failure, not evidence that the frontend needs the named tool.

**How to apply:** Compare the named path against `.replit`, the package lockfile, and the cached environment. Prefer removing unused language modules and refreshing the Nix environment/channel; do not add or downgrade npm packages solely to match the stale path.