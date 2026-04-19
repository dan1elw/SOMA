# Contributing to SOMA

## Setup

```bash
node -v   # must be >= 20
npm install
npm run dev
```

## Development commands

| Command             | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Start Vite dev server      |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint`      | ESLint                     |
| `npm test`          | Vitest unit tests          |
| `npm run build`     | Production build           |

## Commit style

Conventional Commits are enforced via commitlint:

```
feat: add ground-track layer
fix: antimeridian split for polar orbits
refactor: extract classifyOrbit to separate module
test: add MEO boundary cases to classifier
docs: update architecture section 5.3
chore: bump satellite.js to 5.x
```

## Architecture

Read [`docs/architecture.md`](docs/architecture.md) before contributing.
All hard constraints are ADRs — do not work around them without a new ADR.

## Code rules (summary)

- TypeScript `strict: true` — no `any`, no suppressions
- Orbit propagation lives in the Web Worker only (ADR-004)
- OMM JSON from CelesTrak only — no TLE parsing (ADR-002)
- No new dependencies without justification
- New feature code ships with at least one unit test
