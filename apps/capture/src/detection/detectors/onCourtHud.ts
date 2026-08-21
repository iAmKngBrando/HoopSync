import { sampleRegionAverage } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";

// Top-left corner rank/chemistry badge. Empirically green-dominant (avg ~(55,77,68) across
// GAME_SCOREBOARD + PLAYER_BOX examples) in a way no other observed screen type matches -
// see brief Section 34a / Phase 3 notes for the full calibration data.
const BADGE_REGION = { x0: 0.15, y0: 0.025, x1: 0.19, y1: 0.07 };

/**
 * Detects the persistent on-court HUD (chemistry/rank box top-left + score bar bottom)
 * shown throughout live gameplay. GAME_SCOREBOARD and PLAYER_BOX turned out, from real
 * captures, to be two ROIs within this same single frame state rather than separate
 * whole-frame screens - see the Phase 3 relabeling notes. This detector is the base
 * "we're on-court" signal; TEAM_STATS and PLAYER_BUILD_INFO detectors can co-fire on top
 * of it since those overlays are drawn over this same HUD, not instead of it.
 */
export const onCourtHudDetector: ScreenDetector = {
  screenType: "ON_COURT_HUD",
  detect(image: DecodedImage): DetectionResult | null {
    const badge = sampleRegionAverage(image, BADGE_REGION);
    const greenOverRed = badge.g - badge.r;
    const greenOverBlue = badge.g - badge.b;
    const matches = greenOverRed > 10 && greenOverBlue > 3 && badge.g > 30;
    if (!matches) return null;

    const confidence = Math.min(1, 0.5 + greenOverRed / 60);
    return {
      screenType: "ON_COURT_HUD",
      confidence,
      reasons: [`rank badge region is green-dominant (${JSON.stringify(badge)})`],
    };
  },
};
