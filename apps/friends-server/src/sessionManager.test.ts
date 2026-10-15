import { describe, expect, it } from "vitest";
import {
  createSessionManagerState,
  handleDisconnect,
  handleGameResult,
  handleJoin,
  handleUpdate,
} from "./sessionManager.js";

function update(overrides: Partial<Parameters<typeof handleUpdate>[2]> = {}) {
  return {
    type: "UPDATE" as const,
    pts: 10,
    reb: 2,
    ast: 3,
    stl: 0,
    blk: 0,
    isLive: true,
    timestamp: 1000,
    ...overrides,
  };
}

describe("handleJoin", () => {
  it("adds the connection to the session's membership", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });

    expect(state.membership.get("s1")).toEqual(new Set(["conn-1"]));
    expect(state.sessions.get("s1")).toEqual(new Map());
  });

  it("moves a connection to a new session on a second JOIN, cleaning up the old one", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });
    handleUpdate(state, "conn-1", update());
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s2", playerName: "Brando" });

    expect(state.membership.has("s1")).toBe(false);
    expect(state.sessions.has("s1")).toBe(false);
    expect(state.membership.get("s2")).toEqual(new Set(["conn-1"]));
  });
});

describe("handleUpdate", () => {
  it("is ignored for a connection that never joined", () => {
    const state = createSessionManagerState();
    const result = handleUpdate(state, "conn-1", update());

    expect(result).toEqual({ player: null, otherConnectionIds: [] });
  });

  it("stores the player state and returns the other session members as broadcast targets", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });
    handleJoin(state, "conn-2", { type: "JOIN", sessionId: "s1", playerName: "JaySmooth" });

    const result = handleUpdate(state, "conn-1", update({ pts: 24 }));

    expect(result.player).toEqual({
      connectionId: "conn-1",
      playerName: "Brando",
      pts: 24,
      reb: 2,
      ast: 3,
      stl: 0,
      blk: 0,
      isLive: true,
      timestamp: 1000,
    });
    expect(result.otherConnectionIds).toEqual(["conn-2"]);
  });
});

describe("handleGameResult", () => {
  it("is ignored for a connection that never joined", () => {
    const state = createSessionManagerState();
    const result = handleGameResult(state, "conn-1", {
      type: "GAME_RESULT",
      outcome: "win",
      yourScore: 21,
      opponentScore: 14,
      opponentName: "DntDaggMe",
      endedAt: 2000,
    });

    expect(result).toEqual({ playerName: null, otherConnectionIds: [] });
  });

  it("reports the sender's name and the rest of the session as broadcast targets", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });
    handleJoin(state, "conn-2", { type: "JOIN", sessionId: "s1", playerName: "JaySmooth" });

    const result = handleGameResult(state, "conn-1", {
      type: "GAME_RESULT",
      outcome: "win",
      yourScore: 21,
      opponentScore: 14,
      opponentName: "DntDaggMe",
      endedAt: 2000,
    });

    expect(result.playerName).toBe("Brando");
    expect(result.otherConnectionIds).toEqual(["conn-2"]);
  });
});

describe("handleDisconnect", () => {
  it("is a no-op for a connection that never joined", () => {
    const state = createSessionManagerState();
    const result = handleDisconnect(state, "conn-1");

    expect(result).toEqual({ sessionId: null, remainingInSession: [] });
  });

  it("removes the connection and reports who remains", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });
    handleJoin(state, "conn-2", { type: "JOIN", sessionId: "s1", playerName: "JaySmooth" });

    const result = handleDisconnect(state, "conn-1");

    expect(result).toEqual({ sessionId: "s1", remainingInSession: ["conn-2"] });
    expect(state.membership.get("s1")).toEqual(new Set(["conn-2"]));
  });

  it("garbage-collects the session once the last member disconnects", () => {
    const state = createSessionManagerState();
    handleJoin(state, "conn-1", { type: "JOIN", sessionId: "s1", playerName: "Brando" });
    handleUpdate(state, "conn-1", update());

    handleDisconnect(state, "conn-1");

    expect(state.membership.has("s1")).toBe(false);
    expect(state.sessions.has("s1")).toBe(false);
  });
});
