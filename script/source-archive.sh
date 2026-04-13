#!/usr/bin/env bash

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p market_packages
git archive --format=zip -o market_packages/target.src.zip HEAD
zip -u -q market_packages/target.src.zip package-lock.json
zip -d -q market_packages/target.src.zip README.md 2>/dev/null || true
TMP=$(mktemp -d)
ln doc/for-firefox.md "$TMP/README.md"
( cd "$TMP" && zip -u -j -q "$ROOT/market_packages/target.src.zip" README.md )
rm -rf "$TMP"
