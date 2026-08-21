import type { DecodedImage } from "../detection/types";

/** Nearest-neighbor upscale - OCR fares much better on these tiny (~30-70px) HUD crops enlarged first. */
export function upscaleImage(image: DecodedImage, factor: number): DecodedImage {
  const width = image.width * factor;
  const height = image.height * factor;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = Math.floor(y / factor);
    for (let x = 0; x < width; x++) {
      const srcX = Math.floor(x / factor);
      const srcIdx = (srcY * image.width + srcX) * 4;
      const dstIdx = (y * width + x) * 4;
      data[dstIdx] = image.data[srcIdx] ?? 0;
      data[dstIdx + 1] = image.data[srcIdx + 1] ?? 0;
      data[dstIdx + 2] = image.data[srcIdx + 2] ?? 0;
      data[dstIdx + 3] = 255;
    }
  }
  return { width, height, data };
}

/**
 * Converts to binary black-on-white: the HUD's bright text on a dark background is
 * inverted (bright -> black, dark -> white) since Tesseract is tuned for classic
 * black-text-on-white-page input.
 */
export function grayscaleAndThreshold(image: DecodedImage, cutoff: number): DecodedImage {
  const data = new Uint8ClampedArray(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i] ?? 0;
    const g = image.data[i + 1] ?? 0;
    const b = image.data[i + 2] ?? 0;
    const brightness = (r + g + b) / 3;
    const value = brightness > cutoff ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  return { width: image.width, height: image.height, data };
}
