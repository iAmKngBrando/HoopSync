import { frameSaturation } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";
import { onCourtHudDetector } from "./onCourtHud";
import { playerBuildInfoDetector } from "./playerBuildInfo";
import { teamStatsDetector } from "./teamStats";

/**
 * The "YOU LOST"/"YOU WON" result screen and its "Winner's Circle" player-card follow-up
 * (frame saturation ~0.35-0.62 - dark red/black background with bold text). This band
 * overlaps PLAYER_BUILD_INFO's (~0.44-0.49), TEAM_STATS' (~0.48-0.65), and the top end of
 * on-court gameplay's (~0.53-0.67), so all three are explicitly excluded rather than
 * relying on saturation alone. The lower bound also leaves a buffer above the loading
 * screen's promo-variant band (up to 0.33 - see gameLoadingScreen.ts).
 */
const SAT_MIN = 0.34;
const SAT_MAX = 0.68;

export const gameResultDetector: ScreenDetector = {
  screenType: "GAME_RESULT",
  detect(image: DecodedImage): DetectionResult | null {
    const sat = frameSaturation(image);
    if (sat < SAT_MIN || sat > SAT_MAX) return null;
    if (onCourtHudDetector.detect(image)) return null;
    if (playerBuildInfoDetector.detect(image)) return null;
    if (teamStatsDetector.detect(image)) return null;

    return {
      screenType: "GAME_RESULT",
      confidence: 0.6,
      reasons: [`saturation ${sat.toFixed(3)} in result-screen band, no on-court HUD or player-matchup signal`],
    };
  },
};
