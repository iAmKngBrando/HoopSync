import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ScreenTag {
  name: string;
  /** Free-text note: what this screen looks like, where in the frame to look. User-editable. */
  description: string;
  /** True for the brief's original Section 8 taxonomy; false for tags added later via the UI. */
  builtin: boolean;
}

/**
 * Mirrors ScreenKind in apps/server/src/twokot/session.py ("Values match the capture
 * tool's labels" - this is that match). apps/server's screens.py is the thing actually
 * being trained/recalibrated, so labeling with anything else just produces data nobody
 * can use - these are the exact categories classify() sorts a frame into. Names are
 * ScreenKind's own string values (lowercase, not HoopSync's older SCREAMING_CASE style)
 * so a labeled dataset can be compared directly against fixture expected.json files.
 */
const DEFAULT_TAGS: ScreenTag[] = [
  {
    name: "my_player_load_screen",
    description: "Your MyPlayer card during pre-game load-in (name, overall, level, build).",
    builtin: true,
  },
  {
    name: "opponent_player_load_screen",
    description: "Opponent's MyPlayer card during pre-game load-in.",
    builtin: true,
  },
  {
    name: "player_matchup",
    description: "Pre-game \"PLAYER MATCHUP\" screen comparing you and your opponent.",
    builtin: true,
  },
  {
    name: "in_game",
    description: "Live gameplay - the persistent scoreboard (and shot-meter box) are on screen and readable.",
    builtin: true,
  },
  {
    name: "game_result",
    description: "Post-game \"YOU WON\" / \"YOU LOST\" banner screen.",
    builtin: true,
  },
  {
    name: "winners_circle",
    description: "\"WINNERS CIRCLE\" screen shown after a win.",
    builtin: true,
  },
  {
    name: "final_game_stats",
    description: "Full \"GAME STATS\" table - can appear mid-game (stats button) or post-game, always the latest totals.",
    builtin: true,
  },
  {
    name: "other",
    description: "Doesn't match any known screen - menus, loading, free-roam/park, etc.",
    builtin: true,
  },
];

function tagsPath(baseDir: string): string {
  return join(baseDir, "tags.json");
}

async function readTags(baseDir: string): Promise<ScreenTag[]> {
  const path = tagsPath(baseDir);
  if (!existsSync(path)) return DEFAULT_TAGS;
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as ScreenTag[];
}

async function writeTags(baseDir: string, tags: ScreenTag[]): Promise<void> {
  await mkdir(baseDir, { recursive: true });
  await writeFile(tagsPath(baseDir), JSON.stringify(tags, null, 2), "utf-8");
}

/** Seeds tags.json with the defaults on first run so it's visible/editable as a real file. */
export async function listTags(baseDir: string): Promise<ScreenTag[]> {
  const path = tagsPath(baseDir);
  if (!existsSync(path)) {
    await writeTags(baseDir, DEFAULT_TAGS);
    return DEFAULT_TAGS;
  }
  return readTags(baseDir);
}

export async function addTag(baseDir: string, name: string, description: string): Promise<ScreenTag[]> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name can't be empty");

  const tags = await listTags(baseDir);
  if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Tag "${trimmed}" already exists`);
  }

  const next = [...tags, { name: trimmed, description: description.trim(), builtin: false }];
  await writeTags(baseDir, next);
  return next;
}

export async function updateTagDescription(
  baseDir: string,
  name: string,
  description: string,
): Promise<ScreenTag[]> {
  const tags = await listTags(baseDir);
  const next = tags.map((t) => (t.name === name ? { ...t, description: description.trim() } : t));
  await writeTags(baseDir, next);
  return next;
}

/** Renames a custom tag. The caller retargets existing dataset examples (see index.ts). */
export async function renameTag(baseDir: string, name: string, newName: string): Promise<ScreenTag[]> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Tag name can't be empty");

  const tags = await listTags(baseDir);
  const tag = tags.find((t) => t.name === name);
  if (!tag) throw new Error(`Unknown tag "${name}"`);
  if (tag.builtin) throw new Error(`"${name}" is a built-in tag`);
  if (tags.some((t) => t.name !== name && t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Tag "${trimmed}" already exists`);
  }

  const next = tags.map((t) => (t.name === name ? { ...t, name: trimmed } : t));
  await writeTags(baseDir, next);
  return next;
}

/** Deletes a custom tag. The caller refuses while dataset examples still use it. */
export async function deleteTag(baseDir: string, name: string): Promise<ScreenTag[]> {
  const tags = await listTags(baseDir);
  const tag = tags.find((t) => t.name === name);
  if (!tag) return tags;
  if (tag.builtin) throw new Error(`"${name}" is a built-in tag`);

  const next = tags.filter((t) => t.name !== name);
  await writeTags(baseDir, next);
  return next;
}
