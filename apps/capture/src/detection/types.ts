/**
 * Structurally identical to the DOM's ImageData - a live renderer frame (canvas
 * getImageData()) satisfies this directly. Kept as our own interface (not the DOM type)
 * so this module has no DOM dependency and can be unit-tested in plain Node against
 * decoded JPEG fixtures (see accuracy.test.ts).
 */
export interface DecodedImage {
  width: number;
  height: number;
  /** RGBA, length = width*height*4. */
  data: Uint8ClampedArray | Uint8Array;
}

export interface DetectionResult {
  screenType: string;
  confidence: number;
  reasons: string[];
}

/**
 * A cheap, deterministic per-frame check (brief Section 29: cheap detector before
 * expensive parsing). Detectors are independent and may co-fire - e.g. TEAM_STATS and
 * ON_COURT_HUD both matching the same frame is correct, not a conflict, since the stats
 * overlay is drawn on top of the persistent on-court HUD rather than replacing it.
 */
export interface ScreenDetector {
  screenType: string;
  detect(image: DecodedImage): DetectionResult | null;
}
