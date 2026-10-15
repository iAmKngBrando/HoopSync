/**
 * Connects to a Friends session manager (local by default, or a remote one
 * via FRIENDS_HOST/FRIENDS_PORT), JOINs a session, and sends synthetic stat
 * UPDATEs on a loop - a manual way to exercise the session manager and the
 * dashboard's Friends widgets (PlayerStatCards, Connected Friends), without
 * needing a second real person's device.
 *
 * Updates are sent every FRIENDS_UPDATE_SECONDS (default 4) rather than on a
 * fast fixed clock, since box-score stats change in discrete bursts, not
 * continuously - this mirrors the event-driven updates a real dashboard
 * would send. Every so often (every ~6 updates, roughly once a minute at the
 * default rate) it also sends a GAME_RESULT, so FRIEND_GAME_RESULT handling
 * can be exercised too.
 *
 * Usage: `pnpm --filter @hoopsync/friends-server simulate-friend -- <sessionId> [playerName]`
 * Remote host/port: `FRIENDS_HOST=1.2.3.4 FRIENDS_PORT=3101 pnpm --filter @hoopsync/friends-server simulate-friend -- hoopsync JaySmooth`
 */
import { WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "@hoopsync/friends-protocol";
import { loadConfig } from "../src/config.js";

const config = loadConfig();
const host = process.env.FRIENDS_HOST ?? "127.0.0.1";
const port = process.env.FRIENDS_PORT ? Number(process.env.FRIENDS_PORT) : config.port;
const sessionId = process.argv[2] ?? "hoopsync";
const playerName = process.argv[3] ?? `FakeFriend${Math.floor(Math.random() * 1000)}`;
const updateSeconds = Number(process.env.FRIENDS_UPDATE_SECONDS ?? 4);

const socket = new WebSocket(`ws://${host}:${port}/friends`);

function send(message: ClientMessage): void {
  socket.send(JSON.stringify(message));
}

let pts = 0;
let reb = 0;
let ast = 0;
let stl = 0;
let blk = 0;
let updateCount = 0;

function randomStatBump(): void {
  // Roughly basketball-shaped: points move the most/most often, assists and
  // rebounds next, steals/blocks rarest.
  const roll = Math.random();
  if (roll < 0.5) pts += [2, 2, 3][Math.floor(Math.random() * 3)]!;
  else if (roll < 0.7) reb += 1;
  else if (roll < 0.9) ast += 1;
  else if (roll < 0.95) stl += 1;
  else blk += 1;
}

socket.on("open", () => {
  console.log(`Connected as "${playerName}", joining session "${sessionId}"`);
  send({ type: "JOIN", sessionId, playerName });

  setInterval(() => {
    updateCount += 1;
    randomStatBump();

    send({
      type: "UPDATE",
      pts,
      reb,
      ast,
      stl,
      blk,
      isLive: true,
      timestamp: Date.now(),
    });
    console.log(`sent: ${pts} PTS ${reb} REB ${ast} AST ${stl} STL ${blk} BLK`);

    if (updateCount % 6 === 0) {
      const outcome = Math.random() < 0.5 ? "win" : "loss";
      const yourScore = 15 + Math.floor(Math.random() * 15);
      const opponentScore = 15 + Math.floor(Math.random() * 15);
      send({
        type: "GAME_RESULT",
        outcome,
        yourScore,
        opponentScore,
        opponentName: "SimOpponent",
        endedAt: Date.now(),
      });
      console.log(`sent game result: ${outcome} ${yourScore}-${opponentScore}`);
      pts = 0;
      reb = 0;
      ast = 0;
      stl = 0;
      blk = 0;
    }
  }, updateSeconds * 1000);
});

socket.on("message", (raw) => {
  const message = JSON.parse(raw.toString()) as ServerMessage;
  console.log("received:", message);
});

socket.on("close", () => console.log("disconnected"));
socket.on("error", (err) => console.error("error:", err));
