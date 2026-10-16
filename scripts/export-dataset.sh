#!/usr/bin/env bash
# Package your tagged capture-tool dataset into one compressed archive, ready
# to send to a co-developer for aggregating training/calibration data. Raw
# session recordings (unlabeled, much bigger) are left out by default.
#
#   ./scripts/export-dataset.sh                       # tagged dataset only
#   ./scripts/export-dataset.sh --include-recordings  # also bundle raw session recordings
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CAPTURE="$ROOT/apps/capture"
OUT_DIR="$ROOT/dataset-exports"
INCLUDE_RECORDINGS=0

for arg in "$@"; do
  case "$arg" in
    --include-recordings) INCLUDE_RECORDINGS=1 ;;
    -h|--help) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

MANIFEST="$CAPTURE/capture-samples/manifest.json"
[[ -f "$MANIFEST" ]] \
  || die "No dataset yet ($MANIFEST doesn't exist) - tag some frames in the capture tool's Dataset tab first."

mkdir -p "$OUT_DIR"

NAME="hoopsync-dataset-$(whoami)-$(date +%Y%m%d-%H%M%S)"
STAGE="$OUT_DIR/$NAME"
ARCHIVE="$OUT_DIR/$NAME.tar.gz"

rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$CAPTURE/capture-samples" "$STAGE/capture-samples"
cp "$CAPTURE/dataset-config/tags.json" "$STAGE/tags.json"

if [[ "$INCLUDE_RECORDINGS" == 1 ]]; then
  if [[ -d "$CAPTURE/session-recordings" ]]; then
    cp -R "$CAPTURE/session-recordings" "$STAGE/session-recordings"
  else
    echo "Note: --include-recordings was given but there are no session recordings to include."
  fi
fi

echo "Dataset summary:"
node -e '
  const examples = require(process.argv[1]);
  const counts = {};
  for (const e of examples) counts[e.screenType] = (counts[e.screenType] || 0) + 1;
  for (const [type, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${type}`);
  }
  console.log(`  ${String(examples.length).padStart(4)}  TOTAL`);
' "$MANIFEST"

tar -C "$OUT_DIR" -czf "$ARCHIVE" "$NAME"
rm -rf "$STAGE"

SIZE="$(du -h "$ARCHIVE" | cut -f1 | tr -d ' ')"
echo
echo "Ready to send: $ARCHIVE ($SIZE)"
if [[ "$INCLUDE_RECORDINGS" == 0 ]]; then
  echo "(raw session recordings not included - add --include-recordings to bundle those too)"
fi
