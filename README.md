# HoopSync

A local-first application that captures, parses, aggregates, and displays live and
historical NBA 2K game statistics for a group of friends playing together — turning
short-lived in-game stat screens into a shared, persistent live dashboard and historical
analytics platform (CourtIQ), including a proprietary player-quality metric (TruePlayer
Rating) once enough historical data exists.

See [`references/HoopSync—Product_Brief_And_Development_Plan.md`](references/HoopSync—Product_Brief_And_Development_Plan.md)
for the full product brief, architecture decisions, and phased development plan. This
README only covers running what currently exists.

## Project layout

- `apps/capture` — Electron desktop app (Phase 1): connects to the Elgato HD60 X capture
  device, pulls live frames, maintains a rolling in-memory frame buffer, and surfaces
  capture diagnostics. Cross-platform (Windows + Mac) via `getUserMedia`.
- `references/` — product brief, development plan, and UI reference mockups.

Planned but not yet started: `apps/server` (event-relay, adapted from
`/Users/Brando/Projects/forza/apps/friends-server`) and `apps/dashboard` (Next.js live +
historical dashboard, modeled on `/Users/Brando/Projects/GamedayBetTrackerr`) — see the
brief's Section 34a for the reasoning.

## Development

Requires Node 20+ and pnpm (`npx pnpm install` works without a global pnpm install).

```bash
npx pnpm install
npx pnpm dev:capture
```

On first run, macOS/Windows will prompt for camera/capture permission for the Electron
app — this is expected; the Elgato HD60 X shows up as a standard video-input device once
Elgato's own capture software (Camera Hub / 4K Capture Utility) has its virtual camera
output enabled.
