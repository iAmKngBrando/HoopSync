#!/usr/bin/env bash
# Pull the latest code and bring dependencies up to date. Run this after someone
# else has pushed changes, before starting HoopSync again.
#
#   ./update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for arg in "$@"; do
  case "$arg" in
    -h|--help) sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

cd "$ROOT"

echo "Pulling latest changes..."
git pull || die "git pull failed - resolve that first (conflicts, uncommitted changes, etc.)."

echo
echo "Installing JS dependencies (dashboard, capture, friends-server)..."
npx pnpm install

echo
echo "Installing server dependencies..."
(cd apps/server && uv sync)

cat <<INFO

Up to date.

If HoopSync is currently running (hoopsync.sh / hoopsync_dev.sh / npx pnpm dev:*),
stop it and start it again - a page refresh is not enough. Code in each app's
main process or preload script only loads once when that app starts, so it
keeps running the old version until the whole process restarts.
INFO
