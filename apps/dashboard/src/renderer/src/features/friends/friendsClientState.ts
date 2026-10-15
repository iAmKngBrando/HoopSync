import type { PlayerState, ServerMessage } from "@hoopsync/friends-protocol";

/** Small friend-group app, not an internet service at scale - a flat retry reconnects promptly for the common "server was just restarted" case, without the added complexity of backoff. */
export const RECONNECT_DELAY_MS = 3000;

export interface ReconnectDecision {
  shouldReconnect: boolean;
  delayMs: number;
}

/** Given whether the disconnect was user-initiated (the Settings toggle), decides whether a socket close should trigger a reconnect attempt. */
export function decideReconnect(userDisconnected: boolean): ReconnectDecision {
  if (userDisconnected) return { shouldReconnect: false, delayMs: 0 };
  return { shouldReconnect: true, delayMs: RECONNECT_DELAY_MS };
}

/** Applies an incoming ServerMessage to a remote-players map, returning a new map (immutable, easy to test and to diff for React). */
export function applyServerMessage(players: Map<string, PlayerState>, message: ServerMessage): Map<string, PlayerState> {
  const next = new Map(players);
  if (message.type === "PLAYER_UPDATE") {
    next.set(message.player.connectionId, message.player);
  } else if (message.type === "PLAYER_LEFT") {
    next.delete(message.connectionId);
  }
  return next;
}

/** Deterministic hash of a connectionId to an HSL color, so each friend gets a stable, distinct color across a session with no shared-palette bookkeeping. */
export function colorForConnection(connectionId: string): string {
  let hash = 0;
  for (let i = 0; i < connectionId.length; i++) {
    hash = (hash * 31 + connectionId.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/** A friend's update is only worth re-sending if the box score or live state actually changed - see LocalPlayerReporter. */
export function hasChanged(a: LocalPlayerState | null, b: LocalPlayerState): boolean {
  if (!a) return true;
  return (
    a.pts !== b.pts ||
    a.reb !== b.reb ||
    a.ast !== b.ast ||
    a.stl !== b.stl ||
    a.blk !== b.blk ||
    a.isLive !== b.isLive
  );
}

export interface LocalPlayerState {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  isLive: boolean;
}
