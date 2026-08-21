import { frameSaturation } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";

/**
 * Two visually distinct sub-patterns were found in real captures: a near-monochrome
 * "THE THEATER" title card (frame saturation ~0.016-0.017) and a colorful "2K26 SEASONS /
 * Waiting for Opponent" pre-game lobby screen (~0.30-0.32, mostly black background with
 * small saturated accents). Both fit the brief's "Loading or pre-game info screen"
 * definition (Section 8). This is a thin first-pass calibration (12 real examples, only 4
 * of the promo variant) - the promo-screen band is narrow and likely needs a stronger,
 * content-based anchor once more examples exist.
 */
const MONOCHROME_MAX_SAT = 0.06;
// Leaves a buffer above MENU_OR_FREE_ROAM's observed max (~0.271) to avoid boundary collisions.
const PROMO_SAT_MIN = 0.29;
const PROMO_SAT_MAX = 0.33;

export const gameLoadingScreenDetector: ScreenDetector = {
  screenType: "GAME_LOADING_SCREEN",
  detect(image: DecodedImage): DetectionResult | null {
    const sat = frameSaturation(image);

    if (sat < MONOCHROME_MAX_SAT) {
      return {
        screenType: "GAME_LOADING_SCREEN",
        confidence: 0.9,
        reasons: [`near-monochrome frame (saturation ${sat.toFixed(3)}) - title-card pattern`],
      };
    }
    if (sat >= PROMO_SAT_MIN && sat <= PROMO_SAT_MAX) {
      return {
        screenType: "GAME_LOADING_SCREEN",
        confidence: 0.5,
        reasons: [`saturation ${sat.toFixed(3)} in promo/lobby-screen band - low-confidence, thin calibration data`],
      };
    }
    return null;
  },
};
