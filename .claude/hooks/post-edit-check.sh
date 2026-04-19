#!/usr/bin/env bash
# Runs after every Edit/Write in the repo.
# Goal: catch the most common ADR violations *before* they compound.
# Fast — no full typecheck, no full test run. That's /verify.

set -euo pipefail

# Read the JSON payload from stdin (Claude Code passes tool context)
payload="$(cat)"

# Extract the edited path (best-effort; hook contract can change)
file_path="$(printf '%s' "$payload" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"

# Only care about TypeScript / TSX under src/
if [[ -z "${file_path:-}" ]] || [[ "$file_path" != *.ts && "$file_path" != *.tsx ]]; then
  exit 0
fi
if [[ "$file_path" != *"/src/"* ]]; then
  exit 0
fi

warnings=()

# --- Anti-pattern 1: propagation in main thread ---------------------------
if [[ "$file_path" != *"/features/orbit/worker/"* ]]; then
  if grep -qE '\b(sgp4|propagate|twoline2satrec|json2satrec)\b' "$file_path" 2>/dev/null; then
    warnings+=("ADR-004 risk: propagation API used outside the Web Worker (src/features/orbit/worker/).")
  fi
fi

# --- Anti-pattern 2: TLE parsing ------------------------------------------
if grep -qE '\btwoline2satrec\b|\bTLE[[:space:]]*[Pp]arser\b' "$file_path" 2>/dev/null; then
  warnings+=("ADR-002 risk: TLE parsing detected. Use OMM (FORMAT=json) instead.")
fi

# --- Anti-pattern 3: stray 'any' ------------------------------------------
if grep -qE ': any([^a-zA-Z0-9_]|$)' "$file_path" 2>/dev/null; then
  warnings+=("Type-safety: ': any' detected. Prefer 'unknown' + type guard.")
fi

# --- Anti-pattern 4: Mapbox GL instead of MapLibre ------------------------
if grep -qE '"mapbox-gl"|from ["\x27]mapbox-gl' "$file_path" 2>/dev/null; then
  warnings+=("ADR-003 risk: mapbox-gl import detected. Use maplibre-gl.")
fi

# --- Anti-pattern 5: raw fetch in a component ----------------------------
if [[ "$file_path" == *.tsx ]]; then
  if grep -qE '\bfetch\s*\(' "$file_path" 2>/dev/null; then
    warnings+=("Convention: raw fetch() in a .tsx component. Route through TanStack Query.")
  fi
fi

# --- Anti-pattern 6: analytics / tracker ----------------------------------
if grep -qiE 'gtag|google-analytics|googletagmanager|posthog|mixpanel|segment\.com' "$file_path" 2>/dev/null; then
  warnings+=("Privacy: analytics / tracker snippet detected. Architecture §11 forbids third-party scripts.")
fi

# Emit warnings if any. Exit 0 regardless — these are advisory, not blocking.
if (( ${#warnings[@]} > 0 )); then
  echo "── SOMA architecture check ──────────────────────────────"
  for w in "${warnings[@]}"; do
    echo "  ⚠ $w"
  done
  echo "─────────────────────────────────────────────────────────"
fi

exit 0
