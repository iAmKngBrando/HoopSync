import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type BoardColumn = "todo" | "doing" | "done";
export type BoardTag = "core" | "cleanup" | "nice-to-have";

/** A tag usable on board cards; custom (non-builtin) tags are managed from the UI. */
export interface BoardTagDef {
  name: string;
  builtin: boolean;
}

export interface BoardCard {
  id: string;
  title: string;
  note?: string;
  column: BoardColumn;
  tag?: string;
  author?: string;
  createdAt: string;
}

/**
 * Starter set reflecting the backlog discussed before this board existed, so it's
 * useful from the first run instead of blank. Only used if references/dev-board.json
 * doesn't exist yet - once it does (checked into git), this is never consulted again.
 */
/** The board's original three tags; seeded into dev-board-tags.json on first run. */
const DEFAULT_TAGS: BoardTagDef[] = [
  { name: "core", builtin: true },
  { name: "cleanup", builtin: true },
  { name: "nice-to-have", builtin: true },
];

const SEED_CARDS: BoardCard[] = [
  {
    id: "seed-1",
    title: "Recalibrate vision pipeline for Proving Grounds / City Games 1v1",
    note: "Pipeline is calibrated for 1v1 Theater; the mode we actually play isn't detected at all. Use session-recordings/668fecdd... as reference frames.",
    column: "todo",
    tag: "core",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "Read live per-stat box score (reb/ast/stl/blk)",
    note: "Only pts + final score are real today - friends roster shows 0 for everything else.",
    column: "todo",
    tag: "core",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-3",
    title: "Stand up the AWS friends-relay and test with a real second person",
    column: "todo",
    tag: "core",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-4",
    title: "Build 2v2/3v3/5v5 squad detection + multi-client sync",
    note: "Needed before Squad Preview becomes real instead of sample data.",
    column: "todo",
    tag: "core",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-5",
    title: "Remove remaining mock/sample data fallbacks",
    column: "todo",
    tag: "cleanup",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-6",
    title: "Decide dev vs. real data split + add a reset tool",
    column: "todo",
    tag: "cleanup",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-7",
    title: "Cap/clean up capture-samples and session-recordings disk usage",
    column: "todo",
    tag: "cleanup",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-8",
    title: "Desktop launcher: open the dashboard only, capture app separately",
    column: "todo",
    tag: "cleanup",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-9",
    title: "Friend game-result toast/notification",
    column: "todo",
    tag: "nice-to-have",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "seed-10",
    title: "Session replay/scrubber over recorded frames",
    column: "todo",
    tag: "nice-to-have",
    createdAt: "2026-10-15T12:00:00.000Z",
  },
];

async function readBoard(path: string): Promise<BoardCard[]> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as BoardCard[];
}

async function writeBoard(path: string, cards: BoardCard[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(cards, null, 2) + "\n", "utf-8");
}

/** Seeds dev-board.json with starter cards on first run so it's visible/editable as a real file. */
export async function listBoard(path: string): Promise<BoardCard[]> {
  if (!existsSync(path)) {
    await writeBoard(path, SEED_CARDS);
    return SEED_CARDS;
  }
  return readBoard(path);
}

export async function addCard(
  path: string,
  title: string,
  note: string | undefined,
  tag: string | undefined,
  author: string | undefined,
): Promise<BoardCard[]> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Card title can't be empty");

  if (tag && !(await listTags(path)).some((t) => t.name === tag)) {
    throw new Error(`Unknown tag "${tag}"`);
  }
  const cards = await listBoard(path);
  const card: BoardCard = {
    id: randomUUID(),
    title: trimmed,
    note: note?.trim() || undefined,
    column: "todo",
    tag,
    author: author?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const next = [...cards, card];
  await writeBoard(path, next);
  return next;
}

export async function moveCard(path: string, id: string, column: BoardColumn): Promise<BoardCard[]> {
  const cards = await listBoard(path);
  const next = cards.map((c) => (c.id === id ? { ...c, column } : c));
  await writeBoard(path, next);
  return next;
}

export async function deleteCard(path: string, id: string): Promise<BoardCard[]> {
  const cards = await listBoard(path);
  const next = cards.filter((c) => c.id !== id);
  await writeBoard(path, next);
  return next;
}

// Tags ------------------------------------------------------------------
// Tag definitions live in dev-board-tags.json next to dev-board.json, so custom
// tags sync between co-developers the same way cards do.

function tagsPath(boardPath: string): string {
  return join(dirname(boardPath), "dev-board-tags.json");
}

async function readTags(path: string): Promise<BoardTagDef[]> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as BoardTagDef[];
}

async function writeTags(path: string, tags: BoardTagDef[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(tags, null, 2) + "\n", "utf-8");
}

/** Seeds dev-board-tags.json on first run so it's visible/editable as a real file. */
export async function listTags(boardPath: string): Promise<BoardTagDef[]> {
  const path = tagsPath(boardPath);
  if (!existsSync(path)) {
    await writeTags(path, DEFAULT_TAGS);
    return DEFAULT_TAGS;
  }
  return readTags(path);
}

export async function addTag(boardPath: string, name: string): Promise<BoardTagDef[]> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name can't be empty");

  const tags = await listTags(boardPath);
  if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Tag "${trimmed}" already exists`);
  }
  const next = [...tags, { name: trimmed, builtin: false }];
  await writeTags(tagsPath(boardPath), next);
  return next;
}

/** Renames a custom tag and rewrites it on every card that uses it. */
export async function renameTag(
  boardPath: string,
  name: string,
  newName: string,
): Promise<BoardTagDef[]> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Tag name can't be empty");

  const tags = await listTags(boardPath);
  const tag = tags.find((t) => t.name === name);
  if (!tag) throw new Error(`Unknown tag "${name}"`);
  if (tag.builtin) throw new Error(`"${name}" is a built-in tag`);
  if (tags.some((t) => t.name !== name && t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Tag "${trimmed}" already exists`);
  }

  const next = tags.map((t) => (t.name === name ? { ...t, name: trimmed } : t));
  await writeTags(tagsPath(boardPath), next);
  const cards = await listBoard(boardPath);
  await writeBoard(
    boardPath,
    cards.map((c) => (c.tag === name ? { ...c, tag: trimmed } : c)),
  );
  return next;
}

/** Deletes a custom tag and clears it from every card that uses it. */
export async function deleteTag(boardPath: string, name: string): Promise<BoardTagDef[]> {
  const tags = await listTags(boardPath);
  const tag = tags.find((t) => t.name === name);
  if (!tag) return tags;
  if (tag.builtin) throw new Error(`"${name}" is a built-in tag`);

  const next = tags.filter((t) => t.name !== name);
  await writeTags(tagsPath(boardPath), next);
  const cards = await listBoard(boardPath);
  await writeBoard(
    boardPath,
    cards.map((c) => (c.tag === name ? { ...c, tag: undefined } : c)),
  );
  return next;
}
