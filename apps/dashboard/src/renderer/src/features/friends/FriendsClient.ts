import type { ClientMessage, GameResultMessage, PlayerState, ServerMessage } from "@hoopsync/friends-protocol";
import { applyServerMessage, decideReconnect, hasChanged, type LocalPlayerState } from "./friendsClientState.js";
import type { FriendsConfig } from "./friendsConfig.js";

export type FriendsStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

/** Resent even when unchanged, so a long steady stretch (same score for a
 * while) doesn't let a receiver's staleness check expire the connection. */
const HEARTBEAT_MS = 20_000;

/**
 * Manages one Friends WebSocket connection: reports this player's own live
 * state (event-driven - only when it actually changes, see
 * friendsClientState.hasChanged) and applies incoming remote-player updates.
 * Unlike forza's FriendsClient this has no fixed-rate send loop, since
 * box-score stats change in discrete bursts, not continuously.
 */
export class FriendsClient {
  private socket: WebSocket | null = null;
  private status: FriendsStatus = "disconnected";
  private remotePlayers = new Map<string, PlayerState>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private config: FriendsConfig | null = null;
  private userDisconnected = true;
  private lastSent: LocalPlayerState | null = null;
  private readonly statusListeners = new Set<() => void>();

  connect(config: FriendsConfig): void {
    this.config = config;
    this.userDisconnected = false;
    this.lastSent = null;
    this.openSocket(false);
  }

  disconnect(): void {
    this.userDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.socket?.close();
    this.socket = null;
    this.remotePlayers = new Map();
    this.setStatus("disconnected");
  }

  getStatus(): FriendsStatus {
    return this.status;
  }

  getRemotePlayers(): Map<string, PlayerState> {
    return this.remotePlayers;
  }

  subscribeStatus(cb: () => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  /** Sends an UPDATE only if the state actually changed since the last send. */
  reportLocalState(state: LocalPlayerState): void {
    if (!hasChanged(this.lastSent, state)) return;
    this.lastSent = state;
    this.sendUpdate(state);
  }

  reportGameResult(result: Omit<GameResultMessage, "type">): void {
    this.send({ type: "GAME_RESULT", ...result });
  }

  private setStatus(status: FriendsStatus): void {
    this.status = status;
    this.statusListeners.forEach((cb) => cb());
  }

  private send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private sendUpdate(state: LocalPlayerState): void {
    this.send({ type: "UPDATE", ...state, timestamp: Date.now() });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.lastSent) this.sendUpdate(this.lastSent);
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private openSocket(isReconnectAttempt: boolean): void {
    if (!this.config) return;
    this.reconnectTimer = null;
    this.setStatus(isReconnectAttempt ? "reconnecting" : "connecting");

    const socket = new WebSocket(`ws://${this.config.host}:${this.config.port}/friends`);
    this.socket = socket;

    socket.onopen = () => {
      this.setStatus("connected");
      this.send({ type: "JOIN", sessionId: this.config!.sessionId, playerName: this.config!.playerName });
      if (this.lastSent) this.sendUpdate(this.lastSent);
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      this.remotePlayers = applyServerMessage(this.remotePlayers, message);
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      const decision = decideReconnect(this.userDisconnected);
      if (!decision.shouldReconnect) {
        this.setStatus("disconnected");
        return;
      }
      this.setStatus("reconnecting");
      this.reconnectTimer = setTimeout(() => this.openSocket(true), decision.delayMs);
    };
  }
}

export const friendsClient = new FriendsClient();
