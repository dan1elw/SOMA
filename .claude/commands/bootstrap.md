---
description: Execute the repository bootstrapping checklist from architecture doc §16. Use only on an empty repo.
---

Execute the repository bootstrapping checklist from `docs/architecture.md` §16.
**Precondition:** the repo is empty except for `docs/`, `CLAUDE.md`, and
`.claude/`. If there is existing source code, STOP and ask me before
overwriting anything.

Steps (in order, verify each before proceeding):

1. Scaffold with `npm create vite@latest . -- --template react-ts` (in place).
2. Install runtime deps:
   `zustand @tanstack/react-query maplibre-gl satellite.js dexie lucide-react`
3. Install dev deps:
   `tailwindcss @tailwindcss/vite vite-plugin-pwa workbox-window`
   `@playwright/test vitest @testing-library/react @testing-library/jest-dom`
   `jsdom eslint prettier husky lint-staged`
   `@typescript-eslint/eslint-plugin @typescript-eslint/parser`
4. Configure Tailwind 4 (via Vite plugin, no separate config needed for v4).
5. Set up ESLint + Prettier with Conventional Commits (commitlint).
6. Create the folder structure from `docs/architecture.md` §7 — empty
   directories with `.gitkeep` are fine for now.
7. Write initial type files: `src/types/omm.ts` and `src/types/satellite.ts`
   matching §5.1 and §5.2 verbatim (structural equivalence).
8. Configure Vite worker support: `worker: { format: 'es' }`.
9. Write the first Vitest unit test for `classifier.ts` (even as a skeleton
   that imports from a not-yet-existing module) — test-first discipline.
10. Create `.github/workflows/ci.yml` with lint / typecheck / test / build
    jobs.
11. Write a minimal README with Setup, Development, and a link to
    `docs/architecture.md`.
12. Commit everything as
    `feat: scaffold SOMA project with base architecture`.

After each step, report: what you did, what files you created/modified, and
any deviation from the checklist. Do not silently skip steps.

**Halt conditions:**
- Conflicting existing files → ask before overwrite.
- Any installed package has a known High/Critical advisory → stop, report,
  wait for direction.
- Tailwind 4 configuration differs from current best practice → pause and
  confirm approach.
