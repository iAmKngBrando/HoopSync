import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendSessionFrame,
  discardSession,
  discardSessionFrames,
  listSessionFrames,
  listSessions,
  sessionFramePath,
  startSession,
} from "./sessionRecording";

const TINY_JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("sessionRecording", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "hoopsync-session-test-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("starts empty and lists no sessions when nothing has been recorded", async () => {
    expect(await listSessions(baseDir)).toEqual([]);
  });

  it("starts a session, appends frames, and lists them in order", async () => {
    const session = await startSession(baseDir);
    expect(session.frameCount).toBe(0);

    const frame1 = await appendSessionFrame(baseDir, session.id, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      width: 1,
      height: 1,
    });
    const frame2 = await appendSessionFrame(baseDir, session.id, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      width: 1,
      height: 1,
    });

    expect(frame1.sequence).toBe(0);
    expect(frame2.sequence).toBe(1);

    const frames = await listSessionFrames(baseDir, session.id);
    expect(frames.map((f) => f.id)).toEqual([frame1.id, frame2.id]);

    const sessions = await listSessions(baseDir);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.frameCount).toBe(2);

    const filePath = sessionFramePath(baseDir, session.id, frame1.filename);
    expect(existsSync(filePath)).toBe(true);
    expect((await readFile(filePath)).length).toBeGreaterThan(0);
  });

  it("discards specific frames without touching the rest", async () => {
    const session = await startSession(baseDir);
    const frame1 = await appendSessionFrame(baseDir, session.id, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      width: 1,
      height: 1,
    });
    const frame2 = await appendSessionFrame(baseDir, session.id, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      width: 1,
      height: 1,
    });

    await discardSessionFrames(baseDir, session.id, [frame1.id]);

    const frames = await listSessionFrames(baseDir, session.id);
    expect(frames.map((f) => f.id)).toEqual([frame2.id]);
    expect(existsSync(sessionFramePath(baseDir, session.id, frame1.filename))).toBe(false);
    expect(existsSync(sessionFramePath(baseDir, session.id, frame2.filename))).toBe(true);
  });

  it("discards an entire session directory", async () => {
    const session = await startSession(baseDir);
    await appendSessionFrame(baseDir, session.id, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      width: 1,
      height: 1,
    });

    await discardSession(baseDir, session.id);

    expect(await listSessions(baseDir)).toEqual([]);
  });
});
