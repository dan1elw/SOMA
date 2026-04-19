---
description: Before writing code, check a proposed change against all ADRs and the WON'T list.
argument-hint: <short description of the proposed change>
---

I am about to implement: **$ARGUMENTS**

Before writing any code, invoke the `architecture-reviewer` subagent on this
proposal. The reviewer should:

1. Read `docs/architecture.md` sections 2, 3 (ADRs), and 10.
2. Verify the proposal against ADR-001 through ADR-009.
3. Verify it does not overlap with the WON'T list (§2.2).
4. Verify it fits the current roadmap phase (§13) — do not anticipate phases
   that haven't started.
5. Return the standard review format (APPROVE / APPROVE-WITH-NOTES / BLOCK).

Only after the review comes back APPROVE or APPROVE-WITH-NOTES do I proceed
to implementation. If BLOCK, present the alternative path instead of fighting
the review.
