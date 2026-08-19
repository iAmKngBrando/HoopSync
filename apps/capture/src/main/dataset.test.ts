import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteDatasetExample, listDatasetExamples, saveDatasetExample } from "./dataset";

// 1x1 red pixel JPEG, tiny enough to inline.
const TINY_JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("dataset", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "hoopsync-dataset-test-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("returns an empty list before anything is saved", async () => {
    expect(await listDatasetExamples(baseDir)).toEqual([]);
  });

  it("saves an example, writing the image file and a manifest entry", async () => {
    const saved = await saveDatasetExample(baseDir, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      screenType: "GAME_SCOREBOARD",
      source: "upload",
      width: 1,
      height: 1,
      originalFilename: "test.jpg",
    });

    expect(saved.screenType).toBe("GAME_SCOREBOARD");
    expect(saved.filename).toMatch(/\.jpg$/);

    const list = await listDatasetExamples(baseDir);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(saved);

    const fileContents = await readFile(join(baseDir, "GAME_SCOREBOARD", saved.filename));
    expect(fileContents.length).toBeGreaterThan(0);
  });

  it("preserves PNG extension", async () => {
    const pngDataUrl = TINY_JPEG_DATA_URL.replace("image/jpeg", "image/png");
    const saved = await saveDatasetExample(baseDir, {
      imageDataUrl: pngDataUrl,
      thumbnailDataUrl: pngDataUrl,
      screenType: "UNKNOWN",
      source: "upload",
      width: 1,
      height: 1,
    });
    expect(saved.filename).toMatch(/\.png$/);
  });

  it("deletes an example's file and manifest entry", async () => {
    const saved = await saveDatasetExample(baseDir, {
      imageDataUrl: TINY_JPEG_DATA_URL,
      thumbnailDataUrl: TINY_JPEG_DATA_URL,
      screenType: "PLAYER_BOX",
      source: "live",
      width: 1,
      height: 1,
    });

    await deleteDatasetExample(baseDir, saved.id);

    expect(await listDatasetExamples(baseDir)).toEqual([]);
    await expect(readFile(join(baseDir, "PLAYER_BOX", saved.filename))).rejects.toThrow();
  });

  it("deleting an unknown id is a no-op", async () => {
    await expect(deleteDatasetExample(baseDir, "does-not-exist")).resolves.toBeUndefined();
  });
});
