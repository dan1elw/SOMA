---
description: Write or update a Vitest unit test for a pure function in src/features/orbit/. Ensures propagator correctness and classifier coverage.
argument-hint: <function or file to test, e.g. classifier or trackGenerator>
---

Write or update the Vitest unit test for: **$ARGUMENTS**

Constraints:
1. Test file lives in `tests/unit/` and mirrors the source filename
   (`src/features/orbit/worker/classifier.ts` → `tests/unit/classifier.test.ts`).
2. For `classifier.ts`: include test cases for ISS (LEO, MM≈15.5), GOES-16
   (GEO, MM≈1.003), a GPS satellite (MEO, MM≈2.0), a Molniya-type (HEO,
   MM≈2.0 but high eccentricity — treat as HEO by rule if below 11.25),
   and an edge case at MM=11.25 and MM=1.05.
3. For propagator: pick one OMM with a known-good ECI position at a specific
   timestamp (document the source in a comment). Assert lat/lon within 0.01°.
4. For trackGenerator: assert antimeridian splitting produces > 1 segment
   when the orbit crosses 180°.
5. No snapshot tests for numeric data. Use explicit expected values.

Do not invoke the `orbit-engineer` agent for this — these tests are yours
to write directly based on the architecture document §5.3 and §6.3.

After writing, run `npm run test -- --run tests/unit/<filename>` and report
the outcome.
