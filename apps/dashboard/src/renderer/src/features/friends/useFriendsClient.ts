import { useEffect, useState } from "react";
import type { PlayerState } from "@hoopsync/friends-protocol";
import { friendsClient, type FriendsStatus } from "./FriendsClient.js";

/** Polls the remote-players map at a fixed rate rather than re-rendering on every single incoming WS packet. */
export function useFriendsRemotePlayers(hz = 2): Map<string, PlayerState> {
  const [players, setPlayers] = useState<Map<string, PlayerState>>(() => friendsClient.getRemotePlayers());

  useEffect(() => {
    const intervalMs = 1000 / hz;
    const id = setInterval(() => setPlayers(friendsClient.getRemotePlayers()), intervalMs);
    return () => clearInterval(id);
  }, [hz]);

  return players;
}

/** Connection status changes are rare, so this subscribes directly rather than polling. */
export function useFriendsStatus(): FriendsStatus {
  const [status, setStatus] = useState<FriendsStatus>(() => friendsClient.getStatus());

  useEffect(() => friendsClient.subscribeStatus(() => setStatus(friendsClient.getStatus())), []);

  return status;
}
