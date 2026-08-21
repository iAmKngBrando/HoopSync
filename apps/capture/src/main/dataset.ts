import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

/**
 * Screen type is an open string, not a fixed enum - see src/main/tags.ts, which manages
 * the persisted, user-extensible tag registry. Kept as plain string (not a union) so new
 * tags don't require a code change, mirroring GamedayBetTrackerr's convention of keeping
 * categorical fields as plain strings validated by application logic.
 */
export type ScreenType = string;

export interface DatasetExample {
  id: string;
  screenType: ScreenType;
  source: "live" | "upload";
  filename: string;
  width: number;
  height: number;
  capturedAt: string;
  thumbnailDataUrl: string;
  originalFilename?: string;
}

export interface SaveDatasetExampleInput {
  /** Full-resolution image as a data URL - "data:image/jpeg;base64,..." or "data:image/png;base64,...". */
  imageDataUrl: string;
  thumbnailDataUrl: string;
  screenType: ScreenType;
  source: "live" | "upload";
  width: number;
  height: number;
  originalFilename?: string;
}

export interface SaveDatasetExampleFromFileInput {
  /** Absolute path to an already-on-disk full-resolution image (e.g. a session recording frame). */
  sourcePath: string;
  thumbnailDataUrl: string;
  screenType: ScreenType;
  source: "live" | "upload";
  width: number;
  height: number;
  originalFilename?: string;
}

function manifestPath(baseDir: string): string {
  return join(baseDir, "manifest.json");
}

async function readManifest(baseDir: string): Promise<DatasetExample[]> {
  const path = manifestPath(baseDir);
  if (!existsSync(path)) return [];
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as DatasetExample[];
}

async function writeManifest(baseDir: string, entries: DatasetExample[]): Promise<void> {
  await mkdir(baseDir, { recursive: true });
  await writeFile(manifestPath(baseDir), JSON.stringify(entries, null, 2), "utf-8");
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; extension: "png" | "jpg" } {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1 || !dataUrl.startsWith("data:image/")) {
    throw new Error("Unsupported image data URL");
  }
  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const extension = header.includes("image/png") ? "png" : "jpg";
  return { buffer: Buffer.from(base64, "base64"), extension };
}

interface PersistMeta {
  screenType: ScreenType;
  source: "live" | "upload";
  width: number;
  height: number;
  thumbnailDataUrl: string;
  originalFilename?: string;
}

async function persistExample(
  baseDir: string,
  buffer: Buffer,
  extension: string,
  meta: PersistMeta,
): Promise<DatasetExample> {
  const id = randomUUID();
  const filename = `${id}.${extension}`;
  const screenTypeDir = join(baseDir, meta.screenType);
  await mkdir(screenTypeDir, { recursive: true });
  await writeFile(join(screenTypeDir, filename), buffer);

  const entry: DatasetExample = {
    id,
    screenType: meta.screenType,
    source: meta.source,
    filename,
    width: meta.width,
    height: meta.height,
    capturedAt: new Date().toISOString(),
    thumbnailDataUrl: meta.thumbnailDataUrl,
    originalFilename: meta.originalFilename,
  };

  const entries = await readManifest(baseDir);
  entries.push(entry);
  await writeManifest(baseDir, entries);
  return entry;
}

export async function listDatasetExamples(baseDir: string): Promise<DatasetExample[]> {
  return readManifest(baseDir);
}

/**
 * Persists one labeled example from an in-memory data URL (the "capture still" / "upload"
 * flows): writes the full-resolution image under <baseDir>/<screenType>/<id>.<ext> and
 * appends its metadata to <baseDir>/manifest.json.
 */
export async function saveDatasetExample(
  baseDir: string,
  input: SaveDatasetExampleInput,
): Promise<DatasetExample> {
  const { buffer, extension } = dataUrlToBuffer(input.imageDataUrl);
  return persistExample(baseDir, buffer, extension, input);
}

/**
 * Same as saveDatasetExample, but the full-resolution image is already a file on disk
 * (used when committing frames out of a session recording) - avoids a wasteful
 * base64 round-trip for what may be hundreds of frames.
 */
export async function saveDatasetExampleFromFile(
  baseDir: string,
  input: SaveDatasetExampleFromFileInput,
): Promise<DatasetExample> {
  const buffer = await readFile(input.sourcePath);
  const extension = extname(input.sourcePath).slice(1) || "jpg";
  return persistExample(baseDir, buffer, extension, input);
}

export async function deleteDatasetExample(baseDir: string, id: string): Promise<void> {
  const entries = await readManifest(baseDir);
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  const filePath = join(baseDir, entry.screenType, entry.filename);
  if (existsSync(filePath)) await rm(filePath);
  await writeManifest(
    baseDir,
    entries.filter((e) => e.id !== id),
  );
}
