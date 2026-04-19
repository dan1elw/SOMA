---
description: Draft a new Architecture Decision Record when an existing ADR needs to change or a new architectural decision is required.
argument-hint: <short title of the decision>
---

Draft a new ADR titled: **$ARGUMENTS**

Follow the format used in `docs/architecture.md` §3. Write the ADR as a
standalone markdown file under `docs/adrs/ADR-0XX-<kebab-title>.md` where
`0XX` is the next free number after the existing ADRs.

Structure:

```
# ADR-0XX: <Title>

**Status:** Proposed
**Date:** <today, ISO-8601>
**Supersedes:** <ADR number if applicable, else "none">

## Context
<What problem triggered this decision?>

## Decision
<One paragraph, unambiguous.>

## Alternatives considered
<At least two, with one-line reason why rejected.>

## Consequences
<Positive and negative. Be honest about trade-offs.>

## Scope impact
<Does this affect any MUST/COULD/WON'T from §2.2? Update §2.2 or justify.>
```

Do **not** mark the ADR as Accepted on your own. Status stays "Proposed"
until I explicitly accept it. Do not edit existing ADRs in `docs/architecture.md`
§3 without a superseding ADR.
