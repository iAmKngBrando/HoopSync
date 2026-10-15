// Maps the friends relay's live roster into the dashboard's existing view
// models (PlayerSummary for the top-of-dashboard cards, ConnectedFriend for
// the sidebar-style panel), so PlayerStatCards/ConnectedFriendsPanel don't
// need to know anything about the friends protocol themselves.

import { useMemo } from 'react';
import { useFriendsConfig } from './FriendsContext';
import { useFriendsRemotePlayers, useFriendsStatus } from './useFriendsClient';
import { colorForConnection } from './friendsClientState';
import { useTrackerDataContext } from '../tracker-data/TrackerDataContext';
import type { PlayerSummary, ConnectedFriend } from '../../types';
import type { FriendsStatus } from './FriendsClient';

const SELF_COLOR = '#8b5cf6';

export interface FriendsRoster {
  enabled: boolean;
  status: FriendsStatus;
  players: PlayerSummary[];
  connectedFriends: ConnectedFriend[];
}

export function useFriendsRoster(): FriendsRoster {
  const { config } = useFriendsConfig();
  const status = useFriendsStatus();
  const remotePlayers = useFriendsRemotePlayers();
  const { dashboard } = useTrackerDataContext();

  const players: PlayerSummary[] = useMemo(() => {
    if (!config.enabled) return [];
    const self: PlayerSummary = {
      id: 'self',
      name: config.playerName,
      position: 'P1',
      avatarColor: SELF_COLOR,
      isSelf: true,
      live: dashboard.currentGame?.status === 'live',
      pts: dashboard.currentGame?.yourScore ?? 0,
      reb: 0,
      ast: 0,
    };
    const others = [...remotePlayers.values()]
      .sort((a, b) => a.connectionId.localeCompare(b.connectionId))
      .map((player, index) => ({
        id: player.connectionId,
        name: player.playerName,
        position: `P${index + 2}`,
        avatarColor: colorForConnection(player.connectionId),
        live: player.isLive,
        pts: player.pts,
        reb: player.reb,
        ast: player.ast,
      }));
    return [self, ...others];
  }, [config.enabled, config.playerName, remotePlayers, dashboard.currentGame]);

  const connectedFriends: ConnectedFriend[] = useMemo(
    () =>
      [...remotePlayers.values()].map((player) => ({
        id: player.connectionId,
        name: player.playerName,
        status: player.isLive ? 'In a game' : 'Online',
        streaming: player.isLive,
      })),
    [remotePlayers],
  );

  return { enabled: config.enabled, status, players, connectedFriends };
}
