---
description: Report current roadmap phase, its goals, and what is explicitly out of scope for this phase.
---

Look at `docs/architecture.md` §13 (Roadmap) and at the git log / current
branch to infer which phase we're in. If ambiguous, ask me to confirm the
phase number.

Then produce:

1. **Current phase** (number + title from §13).
2. **Deliverables for this phase** (bullet list from the doc).
3. **What is explicitly NOT part of this phase** — either because it belongs
   to a later phase or because it's on the WON'T list. Name the later phase
   or the WON'T reason.
4. **Gap check:** which §13 deliverables for the current phase are already
   in `main` vs. still missing? Grep the repo to be concrete.

Do not propose new features. This command reports status only.
