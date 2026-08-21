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
 * Seed taxonomy from the product brief (Section 8), plus MENU_OR_FREE_ROAM - added so the
 * is_game_live detector (Section 9) has a labelable negative case distinct from the
 * generic UNKNOWN catch-all. Descriptions are intentionally generic/brief-sourced, not
 * guesses at actual NBA 2K26 UI specifics - refine them once real screens have been seen.
 */
const DEFAULT_TAGS: ScreenTag[] = [
  { name: "GAME_SCOREBOARD", description: "Score, quarter, and game clock overlay.", builtin: true },
  { name: "PLAYER_STATS", description: "A single player's full stat line screen.", builtin: true },
  { name: "TEAM_STATS", description: "Full team stat table / box score screen.", builtin: true },
  { name: "PLAYER_BOX", description: "Small corner player stat box shown during live play.", builtin: true },
  { name: "GAME_LOADING_SCREEN", description: "Loading or pre-game info screen.", builtin: true },
  { name: "GAME_RESULT", description: "Post-game result / summary screen.", builtin: true },
  { name: "GAME_START", description: "Screen shown as a game begins.", builtin: true },
  { name: "GAME_END", description: "Screen shown as a game ends.", builtin: true },
  { name: "PLAYER_BUILD_INFO", description: "MyPlayer build/archetype info screen.", builtin: true },
  {
    name: "MENU_OR_FREE_ROAM",
    description: "Menus, lobby, MyPark/free-roam - not an active game.",
    builtin: true,
  },
  { name: "UNKNOWN", description: "Doesn't clearly match any known screen type yet.", builtin: true },
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
