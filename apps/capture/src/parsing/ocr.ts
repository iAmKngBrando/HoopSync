import { PNG } from "pngjs";
import { createWorker, PSM, type Worker } from "tesseract.js";
import type { DecodedImage } from "../detection/types";

/**
 * Node-only for now: encodes crops to PNG via pngjs and runs tesseract.js's Node path.
 * This will need a browser-side counterpart (canvas -> Blob, tesseract.js's browser
 * build) when the live capture pipeline is wired up in a later phase - the pure crop/
 * preprocess/validate functions this sits on top of are already environment-agnostic and
 * ready for that.
 */

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng").then(async (worker) => {
      // These crops only ever contain digits and "%" - a whitelist meaningfully improves
      // accuracy over general-purpose text recognition. SINGLE_LINE fits these tiny
      // isolated crops much better than the default page-layout-detection mode.
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789%",
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
    });
  }
  return workerPromise;
}

/** Releases the shared worker. Call this once at the end of a process/test run. */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
}

function toPngBuffer(image: DecodedImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data);
  return PNG.sync.write(png);
}

export interface OcrResult {
  text: string;
  /** 0-100, Tesseract's own reported confidence for this read. */
  confidence: number;
}

export async function recognizeDigits(image: DecodedImage): Promise<OcrResult> {
  const worker = await getWorker();
  const buffer = toPngBuffer(image);
  const { data } = await worker.recognize(buffer);
  return { text: data.text, confidence: data.confidence };
}
