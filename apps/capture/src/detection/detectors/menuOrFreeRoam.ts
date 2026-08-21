import { frameBrightness, frameSaturation } from "../pixelSampling";
import type { DecodedImage, DetectionResult, ScreenDetector } from "../types";
import { onCourtHudDetector } from "./onCourtHud";

/**
 * Menus, lobby, and MyPark/free-roam navigation. Distinctly lower saturation than
 * gameplay (~0.19-0.27 vs ~0.53-0.67) and notably brighter than the dark loading-screen
 * patterns (avg brightness ~111 vs ~44), since these are lit indoor hub/menu scenes.
 */
const SAT_MIN = 0.15;
const SAT_MAX = 0.28;
const MIN_BRIGHTNESS = 90;

export const menuOrFreeRoamDetector: ScreenDetector = {
  screenType: "MENU_OR_FREE_ROAM",
  detect(image: DecodedImage): DetectionResult | null {
    const sat = frameSaturation(image);
    if (sat < SAT_MIN || sat > SAT_MAX) return null;
    const brightness = frameBrightness(image);
    if (brightness < MIN_BRIGHTNESS) return null;
    if (onCourtHudDetector.detect(image)) return null;

    return {
      screenType: "MENU_OR_FREE_ROAM",
      confidence: 0.7,
      reasons: [`low saturation (${sat.toFixed(3)}) with bright scene (${brightness.toFixed(0)})`],
    };
  },
};
