// Polls apps/server for opponents/games/stats/live every 5s, same cadence as
// 2kot-app. Shared by the OT Analytics tab and the Live Dashboard's
// idle/opponent view, since both read the same underlying tracker state.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { buildDashboardData } from './mapping';
import type { CaptureState, DashboardData, Game, LiveState, Opponent, Statistics } from './types';

const REFRESH_MS = 5000;

export type Connection = 'loading' | 'online' | 'offline';

const emptyStats: Statistics = {
  total_games: 0,
  total_wins: 0,
  total_losses: 0,
  overall_win_rate: 0,
  current_streak: 0,
  most_frequent_opponents: [],
};

export function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Something went wrong';
}

export interface TrackerData {
  opponents: Opponent[];
  games: Game[];
  stats: Statistics;
  live: LiveState | null;
  connection: Connection;
  online: boolean;
  captureState: CaptureState;
  dashboard: DashboardData;
  refresh: () => Promise<void>;
}

export function useTrackerData(): TrackerData {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Statistics>(emptyStats);
  const [live, setLive] = useState<LiveState | null>(null);
  const [connection, setConnection] = useState<Connection>('loading');

  const refresh = useCallback(async () => {
    try {
      const [nextOpponents, nextGames, nextStats, nextLive] = await Promise.all([
        api.listOpponents(),
        api.listGames(),
        api.getStatistics(),
        api.getLive(),
      ]);
      setOpponents(nextOpponents);
      setGames(nextGames);
      setStats(nextStats);
      setLive(nextLive);
      setConnection('online');
    } catch {
      setConnection('offline');
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const dashboard = useMemo(() => buildDashboardData(opponents, games, stats, live), [opponents, games, stats, live]);
  const online = connection === 'online';
  const captureState: CaptureState = live?.capture_state ?? 'disconnected';

  return { opponents, games, stats, live, connection, online, captureState, dashboard, refresh };
}
