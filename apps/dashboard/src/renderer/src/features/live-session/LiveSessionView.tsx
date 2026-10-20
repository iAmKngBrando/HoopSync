// Idle/opponent-tracking state of the Live Dashboard: what apps/server can
// actually report today (a single you-vs-opponent session). Shown until a
// squad (2v2/3v3/5v5) game is detected, which needs new vision/session work
// the ported 2kOT pipeline doesn't do yet — see the product brief's §34b
// "Deferred / Future To-Dos".
//
// Quick Stats / Recent Opponents live under OT Analytics now (same data, so
// showing them here too would just duplicate that tab) - Live Scoreboard and
// Connected Friends take their place, brought back from the original squad
// dashboard. Recent games reuses OT Analytics' own GameHistoryTable (limited
// to a handful of rows) rather than SessionHistoryPanel, which is squad-shaped
// (a "players" roster per row) and still sample-only for that reason - see
// DashboardView's Squad Preview, the one place it's still correct to use.
//
// Layout: the big score is the highest-frequency glance during live play, so
// LiveScoreboard leads, ahead of the CurrentGameCard matchup visual (which
// only matters once per game, not every few seconds) - CurrentGameCard's own
// status pill was trimmed to just the game state for the same reason, since
// repeating the score/clock there would just be the same numbers twice.
// EndGameResultCard and MatchupPreviewCard are mutually exclusive in practice
// (never both "just finished" and "waiting on next matchup" at once), and
// during most of a live game neither applies - collapsed into one slot that
// takes the full row when relevant and disappears rather than wasting half a
// row on two empty cards most of the time.
//
// LiveScoreboard is also sticky (stays pinned to the top of the scroll area),
// so the score is still visible after scrolling down to Game History or
// Connected Friends mid-game - the ".glass" card style it already has gives
// it a real (blurred, not transparent) background to sit over scrolled
// content, so this needed no extra styling beyond "sticky top-0".
//
// CurrentGameCard also takes matchupHistory (derived from the same raw
// games/opponents this hook already fetches - GameDetailDialog over in OT
// Analytics already shows these same captured frames, this just surfaces
// them from the Live Dashboard too), so it has something to step through
// via its own prev/next arrows instead of only ever showing "Awaiting
// matchup" when nothing's live.

import { useMemo } from 'react';
import { useTrackerDataContext } from '../tracker-data/TrackerDataContext';
import { useFriendsRoster } from '../friends/useFriendsRoster';
import { toMatchupHistory } from '../tracker-data/mapping';
import { CurrentGameCard } from './CurrentGameCard';
import { MatchupPreviewCard } from './MatchupPreviewCard';
import { EndGameResultCard } from './EndGameResultCard';
import { OpponentQuickStats } from '../ot-analytics/OpponentQuickStats';
import { GameHistoryTable } from '../ot-analytics/GameHistoryTable';
import { LiveScoreboard } from '../../components/LiveScoreboard';
import { ConnectedFriendsPanel } from '../../components/ConnectedFriendsPanel';
import { PlayerStatCards } from '../../components/PlayerStatCards';
import { Card, SectionHeader } from '../../components/ui/Card';
import { connectedFriends as sampleConnectedFriends } from '../../data/mockData';
import { ServerOff } from 'lucide-react';

export function LiveSessionView() {
  const { dashboard, connection, games, opponents } = useTrackerDataContext();
  const friends = useFriendsRoster();
  const matchupHistory = useMemo(() => toMatchupHistory(games, opponents), [games, opponents]);

  if (connection === 'offline') {
    return (
      <div className="p-5">
        <Card label="Tracker service offline" className="mx-auto max-w-xl items-center py-10 text-center">
          <ServerOff className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Tracker service is offline</h2>
          <p className="mt-1 max-w-sm text-sm text-foreground-secondary">
            The live session view is driven by the local HoopSync server. Start it and this page will
            reconnect on its own.
          </p>
          <code className="panel-inset mt-4 px-3 py-2 text-xs text-primary">pnpm dev:server</code>
        </Card>
      </div>
    );
  }

  const game = dashboard.currentGame;
  const isLive = game?.status === 'live';

  return (
    <div className="flex flex-col gap-4 p-5">
      {dashboard.isSample && (
        <div className="flex items-center gap-2 rounded-inset border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          Sample data — nothing tracked yet.
        </div>
      )}

      {friends.enabled && friends.players.length > 0 && <PlayerStatCards players={friends.players} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="sticky top-0 z-10 xl:col-span-8">
          <SectionHeader title="LIVE SCOREBOARD" live={isLive} />
          <LiveScoreboard
            myScore={game?.yourScore ?? 0}
            opponentScore={game?.opponentScore ?? 0}
            quarter={game?.quarter ? `Q${game.quarter}` : undefined}
            clock={game?.clock}
          />
        </Card>
        <OpponentQuickStats opponent={dashboard.focusOpponent} className="xl:col-span-4" />

        <CurrentGameCard game={game} history={matchupHistory} className="xl:col-span-12" />

        {dashboard.nextMatchup ? (
          <MatchupPreviewCard matchup={dashboard.nextMatchup} className="xl:col-span-12" />
        ) : (
          dashboard.endGame && <EndGameResultCard result={dashboard.endGame} className="xl:col-span-12" />
        )}

        <GameHistoryTable games={dashboard.history} limit={5} className="xl:col-span-8" />
        <ConnectedFriendsPanel
          friends={friends.enabled ? friends.connectedFriends : sampleConnectedFriends}
          className="xl:col-span-4"
        />
      </div>
    </div>
  );
}
