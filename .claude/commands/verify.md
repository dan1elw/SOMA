---
description: Runs the full local quality gate (typecheck, lint, test) and reports results.
---

Run the local quality gate in this exact order and report each step's outcome:

1. `npm run typecheck` (should map to `tsc --noEmit`)
2. `npm run lint` (ESLint + Prettier check)
3. `npm run test -- --run` (Vitest, single run, not watch mode)

If any step fails:
- Stop at the first failure.
- Report the exact error output (not a summary).
- Propose the minimal fix — do not apply it unless I confirm.

If all three pass:
- Report "Quality gate: GREEN" plus a one-line summary per step.
- Do not run `npm run build` unless I ask — it is slow and not needed for
  verification during normal development.
