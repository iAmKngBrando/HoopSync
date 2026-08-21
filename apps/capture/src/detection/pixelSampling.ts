import type { DecodedImage } from "./types";

/** A rectangular region expressed as fractions of frame width/height (0-1), so it's resolution-independent. */
export interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface RegionColor {
  r: number;
  g: number;
  b: number;
}

const GRID_STEPS = 20;

function pixelAt(image: DecodedImage, x: number, y: number): RegionColor {
  const idx = (y * image.width + x) * 4;
  return { r: image.data[idx] ?? 0, g: image.data[idx + 1] ?? 0, b: image.data[idx + 2] ?? 0 };
}

/** Average color over a region, sampled on a coarse grid rather than every pixel (cheap - Section 29). */
export function sampleRegionAverage(image: DecodedImage, region: Region): RegionColor {
  const x0 = Math.floor(region.x0 * image.width);
  const x1 = Math.floor(region.x1 * image.width);
  const y0 = Math.floor(region.y0 * image.height);
  const y1 = Math.floor(region.y1 * image.height);
  const stepX = Math.max(1, Math.floor((x1 - x0) / GRID_STEPS));
  const stepY = Math.max(1, Math.floor((y1 - y0) / GRID_STEPS));

  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y += stepY) {
    for (let x = x0; x < x1; x += stepX) {
      const c = pixelAt(image, x, y);
      r += c.r;
      g += c.g;
      b += c.b;
      n++;
    }
  }
  if (n === 0) return { r: 0, g: 0, b: 0 };
  return { r: r / n, g: g / n, b: b / n };
}

/**
 * Average color saturation ((max-min)/max per pixel) across the whole frame, sampled on a
 * coarse grid. Basketball gameplay is highly saturated (~0.5-0.7); menus/loading screens
 * are notably less so - this is the primary signal for several detectors below.
 */
export function frameSaturation(image: DecodedImage): number {
  const stepX = Math.max(1, Math.floor(image.width / 60));
  const stepY = Math.max(1, Math.floor(image.height / 40));
  let satSum = 0, n = 0;
  for (let y = 0; y < image.height; y += stepY) {
    for (let x = 0; x < image.width; x += stepX) {
      const c = pixelAt(image, x, y);
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);
      satSum += max === 0 ? 0 : (max - min) / max;
      n++;
    }
  }
  return n === 0 ? 0 : satSum / n;
}

/** Average brightness (0-255) across the whole frame, sampled on a coarse grid. */
export function frameBrightness(image: DecodedImage): number {
  const stepX = Math.max(1, Math.floor(image.width / 60));
  const stepY = Math.max(1, Math.floor(image.height / 40));
  let briSum = 0, n = 0;
  for (let y = 0; y < image.height; y += stepY) {
    for (let x = 0; x < image.width; x += stepX) {
      const c = pixelAt(image, x, y);
      briSum += (c.r + c.g + c.b) / 3;
      n++;
    }
  }
  return n === 0 ? 0 : briSum / n;
}
