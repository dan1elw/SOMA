---
name: commit
description: "Use when: generating a conventional commit message for SOMA staged changes. Analyzes git diff of staged files and produces a structured commit message following conventional commits standard (feat/fix/refactor/test/docs/chore with optional scope)."
---

# Generate Conventional Commit Message

Analyze the staged changes in the SOMA repository and generate a commit message following the **Conventional Commits** standard as documented in `CLAUDE.md` (Section 6: Code-Qualitäts-Regeln).

## Constraints

- **Standard Format**: `type(scope): description`
- **Valid Types**: 
  - `feat:` New feature
  - `fix:` Bug fix
  - `refactor:` Code reorganization (no behavioral change)
  - `test:` Test additions or changes
  - `docs:` Documentation updates
  - `chore:` Build, CI, dependencies, tooling
- **Scope** (optional): Feature area from SOMA's structure (e.g., `map`, `search`, `detail`, `orbit`, `catalog`, `offline`)
- **Description**: Imperative voice, lowercase start, no period. Max ~50 characters.
- **Body** (if needed): Explain *why* and *what*, not *how*. Max 72 chars per line. Add after blank line.
- **Breaking Changes**: If this breaks the API or is incompatible, add footer: `BREAKING CHANGE: description`

## Process

1. **Fetch staged changes**: Run `git diff --cached --name-only` and `git diff --cached` to see what's staged
2. **Categorize**: Determine the primary change type and scope
3. **Analyze impact**: 
   - Does it affect architecture (ADR violation risk)? Flag it.
   - New dependencies? Add to scope context.
   - Breaking changes? Include `BREAKING CHANGE:` footer.
4. **Generate message**: Construct the commit message with type, scope, and description
5. **Validate**: Confirm it follows Conventional Commits and aligns with SOMA's tech stack

## Examples

✅ **Good commits for SOMA:**
```
feat(map): add antimeridian split for ground tracks
fix(orbit): correct SGP4 propagation in worker
test(catalog): add unit tests for orbit classifier
docs: update architecture guide for cache TTLs
chore(deps): upgrade MapLibre GL to v4.1.0
refactor(search): optimize fuzzy match algorithm
```

❌ **Bad commits:**
- `update stuff` (no type, unclear scope)
- `feat: Added new feature` (capitalized, no specific description)
- `fix(everything): various tweaks` (vague scope)

## Output Format

Provide the complete commit message ready to paste:

```
<type>(scope): <description>

[optional body explaining why]
```

OR, if only a single-line commit is needed:

```
<type>(scope): <description>
```

---

**Tip**: If the staged changes span multiple features (e.g., both `map` and `catalog` changes), consider splitting into two commits—one per scope—to keep history clean.
