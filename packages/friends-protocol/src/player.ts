/**
 * A friend's last known state within a HoopSync Friends session.
 * `connectionId` is server-assigned and stable for the lifetime of one
 * WebSocket connection - the only safe key for identifying a player, since
 * two friends could freely type the same `playerName`.
 */
export interface PlayerState {
  connectionId: string;
  playerName: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  /** True while this friend's own capture reports them as in an active game. */
  isLive: boolean;
  timestamp: number;
}
