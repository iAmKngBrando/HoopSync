import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface SessionFrame {
  id: string;
  sequence: number;
  /** ms since epoch when the frame was sampled. */
  timestamp: number;
  filename: string;
  width: number;
  height: number;
  thumbnailDataUrl: string;
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  frameCount: number;
}

interface SessionIndex {
  startedAt: string;
  frames: SessionFrame[];
}

function sessionDir(baseDir: string, sessionId: string): string {
  return join(baseDir, sessionId);
}

function indexPath(baseDir: string, sessionId: string): string {
  return join(sessionDir(baseDir, sessionId), "index.json");
}

async function readIndex(baseDir: string, sessionId: string): Promise<SessionIndex> {
  const raw = await readFile(indexPath(baseDir, sessionId), "utf-8");
  return JSON.parse(raw) as SessionIndex;
}

async function writeIndex(baseDir: string, sessionId: string, index: SessionIndex): Promise<void> {
  await writeFile(indexPath(baseDir, sessionId), JSON.stringify(index, null, 2), "utf-8");
}

export async function startSession(baseDir: string): Promise<SessionSummary> {
  const id = randomUUID();
  const startedAt = new Date().toISOString();
  await mkdir(sessionDir(baseDir, id), { recursive: true });
  await writeIndex(baseDir, id, { startedAt, frames: [] });
  return { id, startedAt, frameCount: 0 };
}

export interface AppendSessionFrameInput {
  imageDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
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

export async function appendSessionFrame(
  baseDir: string,
  sessionId: string,
  input: AppendSessionFrameInput,
): Promise<SessionFrame> {
  const index = await readIndex(baseDir, sessionId);
  const { buffer, extension } = dataUrlToBuffer(input.imageDataUrl);
  const id = randomUUID();
  const filename = `${id}.${extension}`;
  await writeFile(join(sessionDir(baseDir, sessionId), filename), buffer);

  const frame: SessionFrame = {
    id,
    sequence: index.frames.length,
    timestamp: Date.now(),
    filename,
    width: input.width,
    height: input.height,
    thumbnailDataUrl: input.thumbnailDataUrl,
  };
  index.frames.push(frame);
  await writeIndex(baseDir, sessionId, index);
  return frame;
}

export async function listSessions(baseDir: string): Promise<SessionSummary[]> {
  if (!existsSync(baseDir)) return [];
  const ids = await readdir(baseDir, { withFileTypes: true });
  const summaries: SessionSummary[] = [];
  for (const entry of ids) {
    if (!entry.isDirectory()) continue;
    if (!existsSync(indexPath(baseDir, entry.name))) continue;
    const index = await readIndex(baseDir, entry.name);
    summaries.push({ id: entry.name, startedAt: index.startedAt, frameCount: index.frames.length });
  }
  return summaries.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function listSessionFrames(baseDir: string, sessionId: string): Promise<SessionFrame[]> {
  if (!existsSync(indexPath(baseDir, sessionId))) return [];
  const index = await readIndex(baseDir, sessionId);
  return index.frames;
}

/** Returns the absolute path to a session frame's full-resolution file, for committing into the dataset. */
export function sessionFramePath(baseDir: string, sessionId: string, filename: string): string {
  return join(sessionDir(baseDir, sessionId), filename);
}

export async function discardSessionFrames(baseDir: string, sessionId: string, frameIds: string[]): Promise<void> {
  const index = await readIndex(baseDir, sessionId);
  const idSet = new Set(frameIds);
  for (const frame of index.frames) {
    if (!idSet.has(frame.id)) continue;
    const filePath = sessionFramePath(baseDir, sessionId, frame.filename);
    if (existsSync(filePath)) await rm(filePath);
  }
  index.frames = index.frames.filter((f) => !idSet.has(f.id));
  await writeIndex(baseDir, sessionId, index);
}

/** Deletes an entire session's staging directory - used once every frame has been committed or discarded. */
export async function discardSession(baseDir: string, sessionId: string): Promise<void> {
  await rm(sessionDir(baseDir, sessionId), { recursive: true, force: true });
}
