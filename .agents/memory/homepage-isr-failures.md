---
name: Homepage ISR failures
description: Why homepage data-loading failures must reject during incremental regeneration.
---

Homepage data-loading failures must reject the regeneration instead of returning empty arrays.

**Why:** Next.js keeps serving the last successful ISR page when regeneration throws. Treating a transient API failure as successful empty data would replace a valid homepage with missing matches and articles for the next cache interval.

**How to apply:** Keep independent homepage requests concurrent, but let any required source failure reject the regeneration. If partial section updates are needed later, add an explicit per-section durable cache rather than silently substituting empty data.