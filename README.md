# HoopSync

A local-first application that captures, parses, aggregates, and displays live and
historical NBA 2K game statistics for a group of friends playing together — turning
short-lived in-game stat screens into a shared, persistent live dashboard and historical
analytics platform (CourtIQ), including a proprietary player-quality metric (TruePlayer
Rating) once enough historical data exists.

See [`references/HoopSync—Product_Brief_And_Development_Plan.md`](references/HoopSync—Product_Brief_And_Development_Plan.md)
for the full product brief, architecture decisions, and phased development plan —
including `§34a`/`§34b`, which record real decisions made as the project evolved (e.g.
why `apps/server` ended up being the ported 2kOT server rather than the originally
planned Next.js/Prisma build). This README only covers running what currently exists.

## Project layout

- `apps/capture` — Electron desktop app: connects to the Elgato HD60 X capture device,
  records/labels sample frames for calibration, and streams live frames to `apps/server`
  for screen reading. Cross-platform (Windows + Mac) via `getUserMedia`.
- `apps/server` — Python/FastAPI server (ported from `2kOT`): the screen-reading/OCR
  pipeline (OpenCV + RapidOCR), session tracking, opponent matching, and SQLite storage.
  The single processing backend both other apps talk to.
- `apps/dashboard` — Electron desktop app: the live dashboard (squad box score preview),
  OT Analytics (opponent records, game history), and its own Settings > Capture Device
  panel for connecting the Elgato directly, without needing `apps/capture` open.
- `references/` — product brief, development plan, and UI reference mockups.
- `resources/`, `scripts/create-desktop-launcher.sh` — builds a quick, unsigned
  `~/Desktop/HoopSync.app` launcher (see below). Not a packaged build of the apps
  themselves.

## Development

Requires Node 20+, pnpm (`npx pnpm install` works without a global pnpm install), and
[uv](https://docs.astral.sh/uv/) for `apps/server`.

```bash
npx pnpm install
cd apps/server && uv sync && cd ../..
```

### Picking up someone else's changes

```bash
./update.sh
```

Pulls, reinstalls JS and server dependencies if anything changed, and reminds you to
restart HoopSync rather than just reloading a window — main-process/preload code in
either Electron app only loads once when that app starts, so a page refresh alone
keeps running the old version.

The first run of `update.sh` on a given clone also turns on `.githooks/post-merge`,
which prints a plain bullet summary of whatever commits a pull just brought in —
after that it fires on *any* `git pull` in that clone, not just through this script
(so it covers a co-dev's agent/tool pulling directly too, as long as it's pulling in
a clone where `update.sh` has run at least once). To turn it on without running
`update.sh` first: `git config core.hooksPath .githooks`.

### Running everything

```bash
./hoopsync.sh               # server + dashboard + capture app, one terminal, Ctrl-C stops all
./hoopsync.sh --no-capture  # skip the capture app
./hoopsync_dev.sh           # same, but one Terminal window per part (separate logs)
```

### Running one piece at a time

```bash
npx pnpm dev:server      # apps/server, http://127.0.0.1:8787 (docs at /docs)
npx pnpm dev:dashboard   # apps/dashboard, Electron window
npx pnpm dev:capture     # apps/capture, Electron window
```

`npx pnpm dev:dashboard:browser` also exists — it serves the dashboard's UI as a plain
browser page instead of Electron. That's for quickly checking UI/layout changes in a
browser; it's not meant for real capture use (the whole reason both apps are Electron is
that a backgrounded browser tab unreliably drops the Elgato connection a minute or two
into a game — see `§34b`).

On first run, macOS/Windows will prompt for camera/capture permission — this is expected;
the Elgato HD60 X shows up as a standard video-input device once Elgato's own capture
software (Camera Hub / 4K Capture Utility) has its virtual camera output enabled.

### Sharing recorded/tagged data

```bash
./scripts/export-dataset.sh                       # your tagged dataset (apps/capture/capture-samples)
./scripts/export-dataset.sh --include-recordings  # also bundle raw session recordings (much bigger)
```

Both developers record and tag frames locally (`apps/capture`'s Dataset tab) - that data
is gitignored, not synced by `git pull`. This packages your tagged dataset (and the tag
registry it was labeled with) into one `.tar.gz` under `dataset-exports/` (also
gitignored), ready to send to the other person so it can be aggregated for training/
calibration work. Prints a per-tag count summary before building the archive. It doesn't
send anything itself - AirDrop, Slack, a shared drive, whatever's convenient.

### Desktop launcher

```bash
./scripts/create-desktop-launcher.sh
```

Builds `~/Desktop/HoopSync.app` — double-click it to open a Terminal window running
`hoopsync.sh`. This is **not committed to git** (it's a per-machine, Desktop-specific
artifact); re-run the script after cloning, or any time you want to rebuild it. It's a
thin, unsigned wrapper, not a real packaged build of the apps — see the product brief's
"Dev → prod transition" to-do for what that would need.
