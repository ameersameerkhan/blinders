#!/bin/sh
# Builds the zip to upload to the Chrome Web Store: dist/blinders-<version>.zip
set -e
cd "$(dirname "$0")/.."
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)
OUT="dist/blinders-$VERSION.zip"
mkdir -p dist
rm -f "$OUT"
zip -qr "$OUT" manifest.json background.js shared.js guard.js theme.css \
  popup.html popup.css popup.js blocked.html blocked.css blocked.js \
  icons fonts -x "*.DS_Store"
echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
