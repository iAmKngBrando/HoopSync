import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Screen-type taxonomy from the product brief (Section 8). Kept here as the source of
 * truth; the renderer mirrors it in src/renderer/src/dataset/screenTypes.ts since main
 * and renderer are separate TS programs.
 */
export const SCREEN_TYPES = [
  "GAME_SCOREBOARD",
  "PLAYER_STATS",
  "TEAM_STATS",
  "PLAYER_BOX",
  "GAME_LOADING_SCREEN",
  "GAME_RESULT",
  "GAME_START",
  "GAME_END",
  "PLAYER_BUILD_INFO",
  "UNKNOWN",
] as const;
export type ScreenType = (typeof SCREEN_TYPES)[number];

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

export async function listDatasetExamples(baseDir: string): Promise<DatasetExample[]> {
  return readManifest(baseDir);
}

/**
 * Persists one labeled example: writes the full-resolution image under
 * <baseDir>/<screenType>/<id>.<ext> and appends its metadata (including the caller-
 * supplied thumbnail, so the gallery never has to re-read full images from disk) to
 * <baseDir>/manifest.json.
 */
export async function saveDatasetExample(
  baseDir: string,
  input: SaveDatasetExampleInput,
): Promise<DatasetExample> {
  const { buffer, extension } = dataUrlToBuffer(input.imageDataUrl);
  const id = randomUUID();
  const filename = `${id}.${extension}`;
  const screenTypeDir = join(baseDir, input.screenType);
  await mkdir(screenTypeDir, { recursive: true });
  await writeFile(join(screenTypeDir, filename), buffer);

  const entry: DatasetExample = {
    id,
    screenType: input.screenType,
    source: input.source,
    filename,
    width: input.width,
    height: input.height,
    capturedAt: new Date().toISOString(),
    thumbnailDataUrl: input.thumbnailDataUrl,
    originalFilename: input.originalFilename,
  };

  const entries = await readManifest(baseDir);
  entries.push(entry);
  await writeManifest(baseDir, entries);
  return entry;
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
