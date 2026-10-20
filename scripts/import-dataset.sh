#!/usr/bin/env bash
# Merge a tagged dataset exported by scripts/export-dataset.sh (received from a
# co-developer) into this machine's local dataset: apps/capture/capture-samples
# and apps/capture/dataset-config/tags.json. New tags/examples are added; nothing
# local is ever overwritten. Any raw session recordings in the archive are left
# alone - this only imports tagged data.
#
#   ./scripts/import-dataset.sh imports/hoopsync-dataset-someone-20261019.tar.gz
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CAPTURE="$ROOT/apps/capture"

for arg in "$@"; do
  case "$arg" in
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

ARCHIVE="${1:-}"
[[ -n "$ARCHIVE" ]] || die "Usage: ./scripts/import-dataset.sh <archive.tar.gz>"
[[ -f "$ARCHIVE" ]] || die "No such file: $ARCHIVE"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "Extracting tagged data from $ARCHIVE (skipping any raw session recordings in it)..."
tar -xzf "$ARCHIVE" -C "$STAGE" '*/capture-samples/*' '*/tags.json'

INNER="$(find "$STAGE" -mindepth 1 -maxdepth 1 -type d | head -1)"
[[ -n "$INNER" && -f "$INNER/capture-samples/manifest.json" ]] \
  || die "Couldn't find capture-samples/manifest.json in that archive - is it one scripts/export-dataset.sh made?"

echo
node "$ROOT/scripts/merge-dataset.cjs" "$INNER" "$CAPTURE"
