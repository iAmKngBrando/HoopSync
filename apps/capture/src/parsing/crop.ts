import type { Region } from "../detection/pixelSampling";
import type { DecodedImage } from "../detection/types";

/** Crops a sub-region (fractions of width/height) out of an image into a new, smaller image. */
export function cropImage(image: DecodedImage, region: Region): DecodedImage {
  const x0 = Math.floor(region.x0 * image.width);
  const y0 = Math.floor(region.y0 * image.height);
  const x1 = Math.floor(region.x1 * image.width);
  const y1 = Math.floor(region.y1 * image.height);
  const width = Math.max(1, x1 - x0);
  const height = Math.max(1, y1 - y0);

  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = ((y0 + y) * image.width + (x0 + x)) * 4;
      const dstIdx = (y * width + x) * 4;
      data[dstIdx] = image.data[srcIdx] ?? 0;
      data[dstIdx + 1] = image.data[srcIdx + 1] ?? 0;
      data[dstIdx + 2] = image.data[srcIdx + 2] ?? 0;
      data[dstIdx + 3] = 255;
    }
  }
  return { width, height, data };
}
