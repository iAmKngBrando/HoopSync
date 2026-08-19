/** Mirrors SCREEN_TYPES in src/main/dataset.ts (brief Section 8) - kept local since main and
 * renderer are separate TS programs (tsconfig.node.json vs tsconfig.web.json). */
export const SCREEN_TYPES = [
  "GAME_SCOREBOARD",
  "PLAYER_STATS",
  "TEAM_STATS",
  "PLAYER_BOX",
  "GAME_LOADING_SCREEN",
  "GAME_RESULT",
  "GAME_START",
  "GAME_END",
  "PLAYER_BUILD_INFO",
  "UNKNOWN",
] as const;

export type ScreenType = (typeof SCREEN_TYPES)[number];
