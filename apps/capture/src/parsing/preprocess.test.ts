import { describe, expect, it } from "vitest";
import { grayscaleAndThreshold, upscaleImage } from "./preprocess";
import type { DecodedImage } from "../detection/types";

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

describe("upscaleImage", () => {
  it("scales dimensions by the given factor", () => {
    const image = solidImage(4, 3, 10, 20, 30);
    const scaled = upscaleImage(image, 3);
    expect(scaled.width).toBe(12);
    expect(scaled.height).toBe(9);
  });

  it("preserves color at scaled coordinates", () => {
    const image: DecodedImage = { width: 2, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]) };
    const scaled = upscaleImage(image, 2);
    // top-left 2x2 block should be black, top-right 2x2 block should be white
    expect(scaled.data[0]).toBe(0);
    expect(scaled.data[2 * 4]).toBe(255);
  });
});

describe("grayscaleAndThreshold", () => {
  it("maps bright pixels (light HUD text) to black", () => {
    const image = solidImage(4, 4, 240, 240, 240);
    const result = grayscaleAndThreshold(image, 140);
    expect(result.data[0]).toBe(0);
  });

  it("maps dark pixels (HUD background) to white", () => {
    const image = solidImage(4, 4, 20, 20, 20);
    const result = grayscaleAndThreshold(image, 140);
    expect(result.data[0]).toBe(255);
  });
});
