#!/usr/bin/env bash
# Start HoopSync for development: four Terminal windows, one each for the
# friends relay, the server, the dashboard and the capture app. The
# dashboard and capture app are Electron windows now, not browser tabs.
# Press Ctrl-C in a window to stop that part.
#
#   ./hoopsync_dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PORT=8787
FRIENDS_PORT=3101

for arg in "$@"; do
  case "$arg" in
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -d "$ROOT/apps/server/.venv" && -d "$ROOT/apps/dashboard/node_modules" \
  && -d "$ROOT/apps/capture/node_modules" && -d "$ROOT/apps/friends-server/node_modules" ]] \
  || die "Dependencies are missing. Run 'pnpm install' at the repo root and 'cd apps/server && uv sync' first."

for port in "$SERVER_PORT" "$FRIENDS_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    die "Port $port is already in use. Is HoopSync already running? (lsof -nP -iTCP:$port -sTCP:LISTEN shows what has it.)"
  fi
done

# open_window <title> <dir> <command>: run the command in a new Terminal window.
open_window() {
  osascript - "$1" "$2" "$3" >/dev/null <<'APPLESCRIPT'
on run {theTitle, theDir, theCommand}
  tell application "Terminal"
    activate
    set theTab to do script "cd " & quoted form of theDir & " && clear && " & theCommand
    set custom title of theTab to theTitle
  end tell
end run
APPLESCRIPT
}

open_window "HoopSync server"    "$ROOT/apps/server"         "uv run python -m twokot --port $SERVER_PORT"
open_window "HoopSync friends"   "$ROOT/apps/friends-server" "npm run dev"
open_window "HoopSync dashboard" "$ROOT/apps/dashboard"      "npm run dev"
open_window "HoopSync capture"   "$ROOT/apps/capture"        "npm run dev"

cat <<INFO
Opened four Terminal windows:
  Server        http://127.0.0.1:$SERVER_PORT/docs
  Friends relay ws://127.0.0.1:$FRIENDS_PORT/friends (off in the dashboard's Settings by default)
  Dashboard     (Electron window)
  Capture app   (Electron window)
Press Ctrl-C in a window to stop that part.
INFO
