#!/usr/bin/env bash
# Runs when the user submits a new prompt.
# Goal: a one-line reminder when the prompt mentions something that often
# triggers scope creep or ADR conflicts. Advisory only.

set -euo pipefail

payload="$(cat)"
prompt="$(printf '%s' "$payload" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"

if [[ -z "${prompt:-}" ]]; then
  exit 0
fi

# Case-insensitive match
lower="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"

reminders=()

if [[ "$lower" =~ (playback|scrub|time[[:space:]]?slider|rewind|fast[[:space:]]?forward) ]]; then
  reminders+=("ADR-009: no playback / scrubbing / TimeSlider in MVP.")
fi
if [[ "$lower" =~ (3d[[:space:]]?globe|cesium|three\.js|3d[[:space:]]?earth) ]]; then
  reminders+=("§2.2 WON'T: 3D globe is explicitly out of scope.")
fi
if [[ "$lower" =~ (favorit|bookmark|save[[:space:]]?sat|history[[:space:]]?of[[:space:]]?sat) ]]; then
  reminders+=("§2.2 WON'T: favourites / history not in MVP.")
fi
if [[ "$lower" =~ (login|signup|auth|account|user[[:space:]]?profile) ]]; then
  reminders+=("§2.2 WON'T: user accounts not in MVP.")
fi
if [[ "$lower" =~ (analytics|tracking|mixpanel|posthog|gtag|segment) ]]; then
  reminders+=("§11: no analytics / trackers / cookies.")
fi
if [[ "$lower" =~ (tle[[:space:]]?pars|two[[:space:]]?line[[:space:]]?element) ]]; then
  reminders+=("ADR-002: OMM (JSON), never TLE parsing.")
fi
if [[ "$lower" =~ mobile ]]; then
  reminders+=("§2.2 WON'T: mobile optimisation out of MVP (functional, not designed).")
fi

if (( ${#reminders[@]} > 0 )); then
  echo "── Architecture reminder ────────────────────────────────"
  for r in "${reminders[@]}"; do
    echo "  • $r"
  done
  echo "  (Run /adr-check if you want a full review before coding.)"
  echo "─────────────────────────────────────────────────────────"
fi

exit 0
