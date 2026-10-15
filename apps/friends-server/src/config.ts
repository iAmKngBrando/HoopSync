import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export interface FriendsServerConfig {
  /** Port to listen on. The server always binds 0.0.0.0 - "hostname" is a client-side concern for where to connect. */
  port: number;
}

const SERVER_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CONFIG_PATH = path.join(SERVER_ROOT, "config.json");

export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): FriendsServerConfig {
  const raw = readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<FriendsServerConfig>;

  if (typeof parsed.port !== "number") {
    throw new Error(`Invalid config at ${configPath}: port must be a number`);
  }

  return { port: parsed.port };
}
