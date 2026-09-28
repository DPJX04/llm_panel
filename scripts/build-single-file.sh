#!/usr/bin/env bash
# Bundles the whole panel into one HTML file, dist/benchmark-panel.html, to email or put on a share drive.
# Reads the file list from src/loadOrder.js, so it never drifts from the app. Usage: bash scripts/build-single-file.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ORDER="$ROOT/src/loadOrder.js"
OUT_DIR="$ROOT/dist"
OUT="$OUT_DIR/benchmark-panel.html"

# Paths from one block of loadOrder.js: styles, scripts, or the entry line.
list_block() {
  sed -n "/^  $1: \[/,/^  \],/p" "$ORDER" | grep -o "'[^']*'" | tr -d "'"
}
ENTRY="$(grep -o "entry: '[^']*'" "$ORDER" | sed "s/entry: '//; s/'//")"
PLATFORM="src/platform/loadErrorBanner.js src/platform/layerRules.js src/platform/moduleRegistry.js"

inline_script() {
  if grep -qi '</script' "$ROOT/$1"; then echo "Cannot inline $1: it contains a closing script tag" >&2; exit 1; fi
  printf '<script>\n/* %s */\n' "$1"
  cat "$ROOT/$1"
  printf '\n</script>\n'
}

mkdir -p "$OUT_DIR"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<title>LLM Benchmark Panel</title>\n<style>\n'
  for path in $(list_block styles); do printf '/* %s */\n' "$path"; cat "$ROOT/$path"; printf '\n'; done
  printf '</style>\n</head>\n<body>\n<div id="app"></div>\n'
  for path in $PLATFORM $(list_block scripts) $ENTRY; do inline_script "$path"; done
  printf '</body>\n</html>\n'
} > "$OUT"

echo "Built $OUT ($(wc -c < "$OUT") bytes)"
