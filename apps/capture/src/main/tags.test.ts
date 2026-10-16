import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addTag, deleteTag, listTags, renameTag, updateTagDescription } from "./tags";

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
    expect(tags.map((t) => t.name)).toContain("in_game");
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
    const tags = await updateTagDescription(baseDir, "other", "Updated note.");
    expect(tags.find((t) => t.name === "other")?.description).toBe("Updated note.");
  });

  it("persists across separate listTags calls", async () => {
    await addTag(baseDir, "MY_TAG", "note");
    const tags = await listTags(baseDir);
    expect(tags.map((t) => t.name)).toContain("MY_TAG");
  });

  it("renames a custom tag", async () => {
    await addTag(baseDir, "OLD_NAME", "note");
    const tags = await renameTag(baseDir, "OLD_NAME", "NEW_NAME");
    expect(tags.map((t) => t.name)).toContain("NEW_NAME");
    expect(tags.find((t) => t.name === "NEW_NAME")?.description).toBe("note");
  });

  it("rejects renaming to an existing name case-insensitively", async () => {
    await addTag(baseDir, "TAG_A", "");
    await expect(renameTag(baseDir, "TAG_A", "in_game")).rejects.toThrow(/already exists/);
  });

  it("rejects renaming or deleting a built-in tag", async () => {
    await expect(renameTag(baseDir, "in_game", "x")).rejects.toThrow(/built-in/);
    await expect(deleteTag(baseDir, "in_game")).rejects.toThrow(/built-in/);
  });

  it("deletes a custom tag", async () => {
    await addTag(baseDir, "SHORT_LIVED", "");
    const tags = await deleteTag(baseDir, "SHORT_LIVED");
    expect(tags.map((t) => t.name)).not.toContain("SHORT_LIVED");
  });
});
