const STORAGE_KEY = "hoopsync-friends-config-v1";

export interface FriendsConfig {
  enabled: boolean;
  host: string;
  port: number;
  sessionId: string;
  playerName: string;
}

// Local by default (matches apps/friends-server's own default port) - point
// host at your AWS relay (or a friend's LAN IP) once actually playing
// together; see FriendsSettingsPanel. Off by default so a fresh install
// doesn't start reconnect-looping against a server that isn't running.
export const DEFAULT_FRIENDS_CONFIG: FriendsConfig = {
  enabled: false,
  host: "127.0.0.1",
  port: 3101,
  sessionId: "hoopsync",
  playerName: "Brando",
};

export function loadFriendsConfig(): FriendsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FRIENDS_CONFIG;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? { ...DEFAULT_FRIENDS_CONFIG, ...parsed } : DEFAULT_FRIENDS_CONFIG;
  } catch {
    return DEFAULT_FRIENDS_CONFIG;
  }
}

export function saveFriendsConfig(config: FriendsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage may be unavailable (private mode, quota) - config just won't persist.
  }
}
