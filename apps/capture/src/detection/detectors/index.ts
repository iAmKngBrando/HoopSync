import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";
import { gameLoadingScreenDetector } from "./gameLoadingScreen";
import { gameResultDetector } from "./gameResult";
import { menuOrFreeRoamDetector } from "./menuOrFreeRoam";
import { onCourtHudDetector } from "./onCourtHud";
import { playerBuildInfoDetector } from "./playerBuildInfo";
import { teamStatsDetector } from "./teamStats";

export {
  gameLoadingScreenDetector,
  gameResultDetector,
  menuOrFreeRoamDetector,
  onCourtHudDetector,
  playerBuildInfoDetector,
  teamStatsDetector,
};

/**
 * All Phase 3 detectors. Order doesn't imply priority - multiple can legitimately match
 * the same frame (see onCourtHud.ts), so callers should treat this as "which of these
 * screen elements are present", not "classify into exactly one type".
 */
export const ALL_DETECTORS: ScreenDetector[] = [
  onCourtHudDetector,
  teamStatsDetector,
  playerBuildInfoDetector,
  gameLoadingScreenDetector,
  gameResultDetector,
  menuOrFreeRoamDetector,
];

export function runDetectors(image: DecodedImage, detectors: ScreenDetector[] = ALL_DETECTORS): DetectionResult[] {
  const results: DetectionResult[] = [];
  for (const detector of detectors) {
    const result = detector.detect(image);
    if (result) results.push(result);
  }
  return results;
}
