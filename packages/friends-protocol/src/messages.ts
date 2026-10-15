import type { PlayerState } from "./player.js";

// Client -> Server

/** Registers this connection into a session under a display name. Sent once, right after the socket opens. */
export interface JoinMessage {
  type: "JOIN";
  sessionId: string;
  playerName: string;
}

/**
 * A live stat snapshot. Does not repeat sessionId/playerName - those were
 * already established by JOIN and are tracked server-side per connection.
 * Unlike a racing telemetry stream, this isn't sent on a fixed clock - the
 * sender should only push one when its locally-known stat line actually
 * changes (a made shot, a rebound, going in/out of a live game), not on a
 * timer, since box-score stats change in discrete bursts, not continuously.
 */
export interface UpdateMessage {
  type: "UPDATE";
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  isLive: boolean;
  timestamp: number;
}

/** Sent once by a client right as its own game ends, summarizing the result just finished. */
export interface GameResultMessage {
  type: "GAME_RESULT";
  outcome: "win" | "loss";
  yourScore: number;
  opponentScore: number;
  opponentName: string | null;
  endedAt: number;
}

export type ClientMessage = JoinMessage | UpdateMessage | GameResultMessage;

// Server -> Client

/** Broadcast to every other connection in the sender's session whenever an UPDATE is accepted. */
export interface PlayerUpdateMessage {
  type: "PLAYER_UPDATE";
  player: PlayerState;
}

/** Broadcast to the remaining connections in a session when a member disconnects. */
export interface PlayerLeftMessage {
  type: "PLAYER_LEFT";
  connectionId: string;
}

/** Broadcast to every other connection in the session when a member's GAME_RESULT is accepted. */
export interface FriendGameResultMessage {
  type: "FRIEND_GAME_RESULT";
  connectionId: string;
  playerName: string;
  result: Omit<GameResultMessage, "type">;
}

export type ServerMessage = PlayerUpdateMessage | PlayerLeftMessage | FriendGameResultMessage;
