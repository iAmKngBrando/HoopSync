import { sampleRegionAverage } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";

// The red "GAME STATS" panel badge, top-left of the popup - bright, elevated red with
// moderate green/blue (a "washed out" pinkish red, not the deep saturated red seen in
// the Park's background wall in plain gameplay shots).
const BADGE_REGION = { x0: 0.165, y0: 0.19, x1: 0.195, y1: 0.225 };

export const teamStatsDetector: ScreenDetector = {
  screenType: "TEAM_STATS",
  detect(image: DecodedImage): DetectionResult | null {
    const badge = sampleRegionAverage(image, BADGE_REGION);
    const matches = badge.r > 140 && badge.g > 50 && badge.b > 50 && badge.r - badge.g > 40;
    if (!matches) return null;

    return {
      screenType: "TEAM_STATS",
      confidence: 0.75,
      reasons: [`GAME STATS badge region matches (${JSON.stringify(badge)})`],
    };
  },
};
