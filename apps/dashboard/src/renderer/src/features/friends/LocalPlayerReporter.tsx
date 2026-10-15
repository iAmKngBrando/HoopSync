// No UI - a side-effect bridge from the tracker data (what the local
// capture/server pipeline knows about *your* game) to the friends relay.
// Rebounds/assists/steals/blocks aren't read live yet (only the final box
// score is, once a game ends) - see the product brief's §34b to-dos; the
// friends protocol already supports them for when that lands.

import { useEffect, useRef } from 'react';
import { useTrackerDataContext } from '../tracker-data/TrackerDataContext';
import { friendsClient } from './FriendsClient';

export function LocalPlayerReporter() {
  const { dashboard, games, opponents } = useTrackerDataContext();
  const lastReportedGameId = useRef<number | null>(null);

  useEffect(() => {
    const game = dashboard.currentGame;
    friendsClient.reportLocalState({
      pts: game?.yourScore ?? 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      isLive: game?.status === 'live',
    });
  }, [dashboard.currentGame]);

  useEffect(() => {
    if (games.length === 0) return;
    const latest = games.reduce((max, g) => (g.id > max.id ? g : max));

    if (lastReportedGameId.current === null) {
      // First load: don't report pre-existing history as a "just finished" game.
      lastReportedGameId.current = latest.id;
      return;
    }
    if (latest.id <= lastReportedGameId.current) return;
    lastReportedGameId.current = latest.id;

    const opponent = opponents.find((o) => o.id === latest.opponent_id);
    friendsClient.reportGameResult({
      outcome: latest.outcome,
      yourScore: latest.your_score,
      opponentScore: latest.opponent_score,
      opponentName: opponent?.name ?? null,
      endedAt: Date.now(),
    });
  }, [games, opponents]);

  return null;
}
