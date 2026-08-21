import { describe, expect, it } from "vitest";
import { frameBrightness, frameSaturation, sampleRegionAverage } from "./pixelSampling";
import type { DecodedImage } from "./types";

function solidImage(width: number, height: number, r: number, g: number, b: number): DecodedImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return { width, height, data };
}

describe("sampleRegionAverage", () => {
  it("returns the solid color for a uniform image", () => {
    const image = solidImage(100, 100, 50, 120, 200);
    expect(sampleRegionAverage(image, { x0: 0, y0: 0, x1: 1, y1: 1 })).toEqual({ r: 50, g: 120, b: 200 });
  });

  it("only samples within the given region", () => {
    const image = solidImage(100, 100, 0, 0, 0);
    // paint the right half white
    for (let y = 0; y < 100; y++) {
      for (let x = 50; x < 100; x++) {
        const idx = (y * 100 + x) * 4;
        image.data[idx] = 255;
        image.data[idx + 1] = 255;
        image.data[idx + 2] = 255;
      }
    }
    const left = sampleRegionAverage(image, { x0: 0, y0: 0, x1: 0.5, y1: 1 });
    const right = sampleRegionAverage(image, { x0: 0.5, y0: 0, x1: 1, y1: 1 });
    expect(left).toEqual({ r: 0, g: 0, b: 0 });
    expect(right).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("frameSaturation", () => {
  it("is zero for a grayscale image", () => {
    const image = solidImage(80, 80, 128, 128, 128);
    expect(frameSaturation(image)).toBe(0);
  });

  it("is high for a fully-saturated color", () => {
    const image = solidImage(80, 80, 255, 0, 0);
    expect(frameSaturation(image)).toBe(1);
  });
});

describe("frameBrightness", () => {
  it("matches the average channel value for a solid image", () => {
    const image = solidImage(80, 80, 60, 90, 120);
    expect(frameBrightness(image)).toBeCloseTo(90, 5);
  });

  it("is 0 for black and 255 for white", () => {
    expect(frameBrightness(solidImage(40, 40, 0, 0, 0))).toBe(0);
    expect(frameBrightness(solidImage(40, 40, 255, 255, 255))).toBe(255);
  });
});
