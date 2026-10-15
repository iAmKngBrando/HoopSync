import type { GameResultMessage, JoinMessage, PlayerState, UpdateMessage } from "@hoopsync/friends-protocol";

interface JoinInfo {
  sessionId: string;
  playerName: string;
}

export interface SessionManagerState {
  /** sessionId -> connectionId -> that connection's last known PlayerState (only present once it has sent >=1 UPDATE). */
  sessions: Map<string, Map<string, PlayerState>>;
  /** sessionId -> every connectionId currently joined, whether or not it has sent an UPDATE yet - the actual broadcast-target audience. */
  membership: Map<string, Set<string>>;
  /** connectionId -> the session/name it joined - needed before its first UPDATE creates a PlayerState. */
  joinInfo: Map<string, JoinInfo>;
}

export function createSessionManagerState(): SessionManagerState {
  return { sessions: new Map(), membership: new Map(), joinInfo: new Map() };
}

function removeFromSession(state: SessionManagerState, sessionId: string, connectionId: string): void {
  state.membership.get(sessionId)?.delete(connectionId);
  state.sessions.get(sessionId)?.delete(connectionId);
  if (state.membership.get(sessionId)?.size === 0) {
    state.membership.delete(sessionId);
    state.sessions.delete(sessionId);
  }
}

/**
 * Registers a connection into a session under a display name. A second JOIN
 * on an already-joined connection is treated as idempotent, moving it to the
 * new session/name - which means cleaning up its membership (if any) in
 * whatever session it previously occupied, or that stale entry would linger
 * forever (the connection's eventual disconnect only cleans up its *current*
 * session).
 */
export function handleJoin(state: SessionManagerState, connectionId: string, message: JoinMessage): void {
  const previous = state.joinInfo.get(connectionId);
  if (previous && previous.sessionId !== message.sessionId) {
    removeFromSession(state, previous.sessionId, connectionId);
  }

  state.joinInfo.set(connectionId, { sessionId: message.sessionId, playerName: message.playerName });
  if (!state.membership.has(message.sessionId)) state.membership.set(message.sessionId, new Set());
  state.membership.get(message.sessionId)!.add(connectionId);
  if (!state.sessions.has(message.sessionId)) state.sessions.set(message.sessionId, new Map());
}

export interface UpdateResult {
  player: PlayerState | null;
  /** Every other connectionId currently joined to this session (regardless of whether they've sent their own update yet) - the broadcast audience for this update. */
  otherConnectionIds: string[];
}

/** Applies a stat update. Silently ignored (no player, no broadcast targets) if this connection never sent a JOIN. */
export function handleUpdate(state: SessionManagerState, connectionId: string, message: UpdateMessage): UpdateResult {
  const info = state.joinInfo.get(connectionId);
  if (!info) return { player: null, otherConnectionIds: [] };

  const player: PlayerState = {
    connectionId,
    playerName: info.playerName,
    pts: message.pts,
    reb: message.reb,
    ast: message.ast,
    stl: message.stl,
    blk: message.blk,
    isLive: message.isLive,
    timestamp: message.timestamp,
  };

  state.sessions.get(info.sessionId)!.set(connectionId, player);
  const members = state.membership.get(info.sessionId) ?? new Set<string>();
  const otherConnectionIds = [...members].filter((id) => id !== connectionId);

  return { player, otherConnectionIds };
}

export interface GameResultResult {
  playerName: string | null;
  /** Every other connectionId currently joined to this session - the broadcast audience for this result. */
  otherConnectionIds: string[];
}

/** Relays a just-finished game's result. Silently ignored (no broadcast) if this connection never sent a JOIN. */
export function handleGameResult(
  state: SessionManagerState,
  connectionId: string,
  message: GameResultMessage,
): GameResultResult {
  const info = state.joinInfo.get(connectionId);
  if (!info) return { playerName: null, otherConnectionIds: [] };

  const members = state.membership.get(info.sessionId) ?? new Set<string>();
  const otherConnectionIds = [...members].filter((id) => id !== connectionId);

  return { playerName: info.playerName, otherConnectionIds };
}

export interface DisconnectResult {
  sessionId: string | null;
  remainingInSession: string[];
}

/** Removes a connection from its session (if any), GC-ing the session entry once it's empty, and reports who's left to notify. */
export function handleDisconnect(state: SessionManagerState, connectionId: string): DisconnectResult {
  const info = state.joinInfo.get(connectionId);
  state.joinInfo.delete(connectionId);
  if (!info) return { sessionId: null, remainingInSession: [] };

  const remainingInSession = [...(state.membership.get(info.sessionId) ?? new Set<string>())].filter(
    (id) => id !== connectionId,
  );
  removeFromSession(state, info.sessionId, connectionId);

  return { sessionId: info.sessionId, remainingInSession };
}
