import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import jpeg from "jpeg-js";
import { describe, expect, it } from "vitest";
import { ALL_DETECTORS } from "./detectors";
import type { DecodedImage } from "./types";

// Reads directly from the local, gitignored capture-samples/ dataset - this is a real-data
// calibration/regression check for this machine, not a portable fixture suite (see brief
// Section 19 for the git-tracked fixtures this should graduate into once a curated,
// privacy-reviewed subset is chosen). Skips gracefully if the directory doesn't exist,
// e.g. on a fresh checkout.
const DATASET_DIR = join(__dirname, "..", "..", "capture-samples");

// Which detector is expected to positively fire for each dataset tag, and the minimum
// recall to require (lenient - this is a first-pass calibration, not a finished model).
// GAME_SCOREBOARD and PLAYER_BOX both map to onCourtHudDetector - see onCourtHud.ts.
const EXPECTATIONS: { screenType: string; detectorName: string; minRecall: number }[] = [
  { screenType: "GAME_SCOREBOARD", detectorName: "ON_COURT_HUD", minRecall: 0.7 },
  { screenType: "PLAYER_BOX", detectorName: "ON_COURT_HUD", minRecall: 0.7 },
  { screenType: "GAME_LOADING_SCREEN", detectorName: "GAME_LOADING_SCREEN", minRecall: 0.6 },
  { screenType: "GAME_RESULT", detectorName: "GAME_RESULT", minRecall: 0.6 },
  { screenType: "TEAM_STATS", detectorName: "TEAM_STATS", minRecall: 0.6 },
  { screenType: "PLAYER_BUILD_INFO", detectorName: "PLAYER_BUILD_INFO", minRecall: 0.6 },
  { screenType: "MENU_OR_FREE_ROAM", detectorName: "MENU_OR_FREE_ROAM", minRecall: 0.6 },
];

function decodeImage(path: string): DecodedImage {
  const raw = jpeg.decode(readFileSync(path), { useTArray: true });
  return { width: raw.width, height: raw.height, data: raw.data };
}

function loadCategory(screenType: string): DecodedImage[] {
  const dir = join(DATASET_DIR, screenType);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
    .map((f) => decodeImage(join(dir, f)));
}

describe.skipIf(!existsSync(DATASET_DIR))("detector accuracy against real captures", () => {
  // Decode once, reuse across every detector/category combination for the confusion matrix.
  const categories = readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const imagesByCategory = new Map(categories.map((c) => [c, loadCategory(c)]));

  it("prints a full detector x category confusion matrix", () => {
    const header = ["category".padEnd(20), "n".padEnd(4), ...ALL_DETECTORS.map((d) => d.screenType.slice(0, 10).padEnd(11))].join(" ");
    console.log(`\n${header}`);
    for (const category of categories) {
      const images = imagesByCategory.get(category) ?? [];
      const rates = ALL_DETECTORS.map((detector) => {
        const hits = images.filter((img) => detector.detect(img) !== null).length;
        const rate = images.length === 0 ? 0 : hits / images.length;
        return `${(rate * 100).toFixed(0)}%`.padEnd(11);
      });
      console.log(`${category.padEnd(20)} ${String(images.length).padEnd(4)} ${rates.join(" ")}`);
    }
  });

  for (const { screenType, detectorName, minRecall } of EXPECTATIONS) {
    it(`${detectorName} detects >= ${minRecall * 100}% of real ${screenType} examples`, () => {
      const images = imagesByCategory.get(screenType) ?? [];
      if (images.length === 0) return; // no examples for this tag yet - nothing to measure
      const detector = ALL_DETECTORS.find((d) => d.screenType === detectorName);
      expect(detector).toBeDefined();
      const hits = images.filter((img) => detector!.detect(img) !== null).length;
      const recall = hits / images.length;
      console.log(`${detectorName} on ${screenType}: ${hits}/${images.length} (${(recall * 100).toFixed(0)}%)`);
      expect(recall).toBeGreaterThanOrEqual(minRecall);
    });
  }
});
