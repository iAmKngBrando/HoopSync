import type { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import type { ClientMessage, FriendGameResultMessage, PlayerLeftMessage, PlayerUpdateMessage } from "@hoopsync/friends-protocol";
import { createSessionManagerState, handleDisconnect, handleGameResult, handleJoin, handleUpdate } from "./sessionManager.js";

function send(socket: WebSocket, message: PlayerUpdateMessage | PlayerLeftMessage | FriendGameResultMessage): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

/**
 * Wraps an HTTP server with a WebSocket endpoint that groups connections into
 * sessions (via sessionManager.ts) and relays stat updates between members of
 * the same session. Logs connects/disconnects/joins/failures individually;
 * per-packet UPDATE logging is intentionally limited to each connection's
 * *first* accepted update (confirms updates are flowing without flooding the
 * log, even though - unlike a 15Hz telemetry stream - updates here are
 * already infrequent, event-driven sends).
 */
export function createFriendsServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/friends" });
  const state = createSessionManagerState();
  const socketsByConnectionId = new Map<string, WebSocket>();
  const hasLoggedFirstUpdate = new Set<string>();

  wss.on("connection", (socket) => {
    const connectionId = randomUUID();
    socketsByConnectionId.set(connectionId, socket);
    console.log(`[friends] connect ${connectionId}`);

    socket.on("message", (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString());
      } catch (err) {
        console.warn(`[friends] failed to parse message from ${connectionId}:`, err);
        return;
      }

      if (message.type === "JOIN") {
        handleJoin(state, connectionId, message);
        console.log(`[friends] join ${connectionId} -> session "${message.sessionId}" as "${message.playerName}"`);
        return;
      }

      if (message.type === "UPDATE") {
        const result = handleUpdate(state, connectionId, message);
        if (!result.player) {
          console.warn(`[friends] update from ${connectionId} ignored (not joined)`);
          return;
        }
        if (!hasLoggedFirstUpdate.has(connectionId)) {
          hasLoggedFirstUpdate.add(connectionId);
          console.log(`[friends] receiving updates from ${connectionId} ("${result.player.playerName}")`);
        }

        const payload: PlayerUpdateMessage = { type: "PLAYER_UPDATE", player: result.player };
        for (const otherId of result.otherConnectionIds) {
          const otherSocket = socketsByConnectionId.get(otherId);
          if (otherSocket) send(otherSocket, payload);
        }
        return;
      }

      if (message.type === "GAME_RESULT") {
        const { type, ...result } = message;
        const relayResult = handleGameResult(state, connectionId, message);
        if (!relayResult.playerName) {
          console.warn(`[friends] game result from ${connectionId} ignored (not joined)`);
          return;
        }
        console.log(`[friends] relaying game result from ${connectionId} ("${relayResult.playerName}")`);

        const payload: FriendGameResultMessage = {
          type: "FRIEND_GAME_RESULT",
          connectionId,
          playerName: relayResult.playerName,
          result,
        };
        for (const otherId of relayResult.otherConnectionIds) {
          const otherSocket = socketsByConnectionId.get(otherId);
          if (otherSocket) send(otherSocket, payload);
        }
      }
    });

    socket.on("close", () => {
      socketsByConnectionId.delete(connectionId);
      hasLoggedFirstUpdate.delete(connectionId);
      const result = handleDisconnect(state, connectionId);
      console.log(`[friends] disconnect ${connectionId}`);
      if (!result.sessionId) return;

      const payload: PlayerLeftMessage = { type: "PLAYER_LEFT", connectionId };
      for (const remainingId of result.remainingInSession) {
        const remainingSocket = socketsByConnectionId.get(remainingId);
        if (remainingSocket) send(remainingSocket, payload);
      }
    });

    socket.on("error", (err) => {
      console.warn(`[friends] socket error for ${connectionId}:`, err);
    });
  });

  return { wss };
}
