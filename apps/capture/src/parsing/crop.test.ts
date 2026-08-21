import { describe, expect, it } from "vitest";
import { cropImage } from "./crop";
import type { DecodedImage } from "../detection/types";

function checkerboard(width: number, height: number): DecodedImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const value = x < width / 2 ? 0 : 255;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("cropImage", () => {
  it("returns the full image for a 0-1 region", () => {
    const image = checkerboard(10, 10);
    const cropped = cropImage(image, { x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(cropped.width).toBe(10);
    expect(cropped.height).toBe(10);
    expect(cropped.data).toEqual(image.data);
  });

  it("crops only the requested fraction", () => {
    const image = checkerboard(100, 100);
    const rightHalf = cropImage(image, { x0: 0.5, y0: 0, x1: 1, y1: 1 });
    expect(rightHalf.width).toBe(50);
    // every pixel in the right half should be white (255)
    for (let i = 0; i < rightHalf.data.length; i += 4) {
      expect(rightHalf.data[i]).toBe(255);
    }
  });

  it("never returns a zero-sized image for a degenerate region", () => {
    const image = checkerboard(10, 10);
    const cropped = cropImage(image, { x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.5 });
    expect(cropped.width).toBeGreaterThan(0);
    expect(cropped.height).toBeGreaterThan(0);
  });
});
