#!/usr/bin/env bash
# Runs tests/index.html in headless Edge or Chrome and prints the results.
# Exits non-zero when any test fails. Usage: bash scripts/run-tests.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

BROWSER=""
for candidate in \
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then BROWSER="$candidate"; break; fi
done
if [ -z "$BROWSER" ]; then
  echo "No Edge or Chrome found. Open tests/index.html in a browser instead." >&2
  exit 2
fi

if command -v cygpath >/dev/null 2>&1; then ROOT_URL="/$(cygpath -m "$ROOT")"; else ROOT_URL="$ROOT"; fi
URL="file://${ROOT_URL// /%20}/tests/index.html"

DOM="$("$BROWSER" --headless=new --disable-gpu --no-first-run --virtual-time-budget=10000 --dump-dom "$URL" 2>/dev/null)"
RESULTS="$(printf '%s' "$DOM" | sed -n '/<pre id="results"/,/<\/pre>/p' | sed -e 's/<[^>]*>//g' -e 's/&quot;/"/g' -e 's/&amp;/\&/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e "s/&#39;/'/g")"

printf '%s\n' "$RESULTS"
printf '%s' "$RESULTS" | sed 's/^[[:space:]]*//' | grep -m1 . | grep -q '^PASS'
