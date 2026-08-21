import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addTag, listTags, updateTagDescription } from "./tags";

describe("tags", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "hoopsync-tags-test-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("seeds the default taxonomy on first read", async () => {
    const tags = await listTags(baseDir);
    expect(tags.map((t) => t.name)).toContain("GAME_SCOREBOARD");
    expect(tags.every((t) => t.builtin)).toBe(true);
  });

  it("adds a new custom tag", async () => {
    const tags = await addTag(baseDir, "REFEREE_REVIEW", "Instant replay review overlay.");
    const added = tags.find((t) => t.name === "REFEREE_REVIEW");
    expect(added).toEqual({ name: "REFEREE_REVIEW", description: "Instant replay review overlay.", builtin: false });
  });

  it("rejects a duplicate tag name case-insensitively", async () => {
    await addTag(baseDir, "CUSTOM_TAG", "");
    await expect(addTag(baseDir, "custom_tag", "")).rejects.toThrow(/already exists/);
  });

  it("rejects an empty tag name", async () => {
    await expect(addTag(baseDir, "   ", "")).rejects.toThrow(/empty/);
  });

  it("updates a tag's description", async () => {
    const tags = await updateTagDescription(baseDir, "UNKNOWN", "Updated note.");
    expect(tags.find((t) => t.name === "UNKNOWN")?.description).toBe("Updated note.");
  });

  it("persists across separate listTags calls", async () => {
    await addTag(baseDir, "MY_TAG", "note");
    const tags = await listTags(baseDir);
    expect(tags.map((t) => t.name)).toContain("MY_TAG");
  });
});
