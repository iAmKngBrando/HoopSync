// Idle/opponent-tracking state of the Live Dashboard: what apps/server can
// actually report today (a single you-vs-opponent session). Shown until a
// squad (2v2/3v3/5v5) game is detected, which needs new vision/session work
// the ported 2kOT pipeline doesn't do yet — see the product brief's §34b
// "Deferred / Future To-Dos".

import { useTrackerData } from '../tracker-data/useTrackerData';
import { CurrentGameCard } from './CurrentGameCard';
import { MatchupPreviewCard } from './MatchupPreviewCard';
import { EndGameResultCard } from './EndGameResultCard';
import { RecentOpponentsList } from './RecentOpponentsList';
import { OpponentQuickStats } from '../ot-analytics/OpponentQuickStats';
import { QuickStatsCard } from '../ot-analytics/QuickStatsCard';
import { GameHistoryTable } from '../ot-analytics/GameHistoryTable';
import { Card } from '../../components/ui/Card';
import { ServerOff } from 'lucide-react';

interface LiveSessionViewProps {
  onViewAllGames?: () => void;
  onSelectGame?: (id: number) => void;
  onViewAllOpponents?: () => void;
}

export function LiveSessionView({ onViewAllGames, onSelectGame, onViewAllOpponents }: LiveSessionViewProps) {
  const { dashboard, connection } = useTrackerData();

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

  return (
    <div className="flex flex-col gap-4 p-5">
      {dashboard.isSample && (
        <div className="flex items-center gap-2 rounded-inset border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          Sample data — nothing tracked yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <CurrentGameCard game={dashboard.currentGame} className="xl:col-span-8" />
        <OpponentQuickStats opponent={dashboard.focusOpponent} className="xl:col-span-4" />

        <EndGameResultCard result={dashboard.endGame} className="xl:col-span-6" />
        <MatchupPreviewCard matchup={dashboard.nextMatchup} className="xl:col-span-6" />

        <GameHistoryTable
          games={dashboard.history}
          limit={5}
          onViewAll={onViewAllGames}
          onSelectGame={dashboard.isSample ? undefined : onSelectGame}
          className="xl:col-span-12"
        />

        <QuickStatsCard stats={dashboard.stats} className="xl:col-span-6" />
        <RecentOpponentsList opponents={dashboard.recentOpponents} onViewAll={onViewAllOpponents} className="xl:col-span-6" />
      </div>
    </div>
  );
}
