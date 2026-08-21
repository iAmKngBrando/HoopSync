import { sampleRegionAverage } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";

// The "Player Matchup - City Games" title bar - empirically a distinctly bright, neutral
// gray (avg ~(115,115,114)) that no other observed screen type matches (everything else
// in this region reads dark and/or color-tinted).
const TITLE_BAR_REGION = { x0: 0.42, y0: 0.06, x1: 0.58, y1: 0.11 };

export const playerBuildInfoDetector: ScreenDetector = {
  screenType: "PLAYER_BUILD_INFO",
  detect(image: DecodedImage): DetectionResult | null {
    const bar = sampleRegionAverage(image, TITLE_BAR_REGION);
    const isNeutral = Math.abs(bar.r - bar.g) < 15 && Math.abs(bar.g - bar.b) < 15;
    const isBright = bar.r > 80;
    if (!isNeutral || !isBright) return null;

    return {
      screenType: "PLAYER_BUILD_INFO",
      confidence: 0.85,
      reasons: [`title bar region is bright neutral gray (${JSON.stringify(bar)})`],
    };
  },
};
