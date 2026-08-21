import type { Region } from "../detection/pixelSampling";

/**
 * ROIs within an onCourtHud-detected frame (brief Section 10: player box is a separate
 * parser from the scoreboard, both crop from the same frame - see Phase 3 notes).
 * Calibrated by cropping real captures and visually verifying column boundaries against
 * apps/capture/capture-samples/GAME_SCOREBOARD/1eeb9f51-de28-4444-82ef-401a7dc8725a.jpg -
 * not guessed. These are fixed fractional slots; they assume right-aligned or
 * fixed-width text within each slot, which hasn't been verified against higher digit
 * counts (e.g. 3-digit PTS) yet since none have been captured so far.
 */
export const PLAYER_BOX_FIELD_REGIONS: Record<"pts" | "reb" | "ast" | "fgPct", Region> = {
  pts: { x0: 0.192, y0: 0.005, x1: 0.225, y1: 0.05 },
  reb: { x0: 0.225, y0: 0.005, x1: 0.256, y1: 0.05 },
  ast: { x0: 0.256, y0: 0.005, x1: 0.272, y1: 0.05 },
  fgPct: { x0: 0.278, y0: 0.005, x1: 0.33, y1: 0.05 },
};

/**
 * Note: the 4th player-box column isn't always FG% - at least one real capture showed
 * "TO" (turnovers) in that slot instead, presumably rotating with game context. This
 * parser always labels it fgPct for now; treat that field with extra skepticism until a
 * badge/label detector distinguishes which stat is actually being shown there.
 */
export const SCOREBOARD_FIELD_REGIONS: Record<"opponentScore" | "myScore" | "shotClock", Region> = {
  opponentScore: { x0: 0.1, y0: 0.935, x1: 0.175, y1: 1.0 },
  myScore: { x0: 0.178, y0: 0.935, x1: 0.245, y1: 1.0 },
  shotClock: { x0: 0.35, y0: 0.935, x1: 0.415, y1: 1.0 },
};
