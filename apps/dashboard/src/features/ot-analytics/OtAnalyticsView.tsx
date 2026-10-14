import { useMemo, useState } from 'react';
import { ServerOff, X } from 'lucide-react';
import { api } from '../tracker-data/api';
import type { NewGameResult } from '../tracker-data/api';
import { messageOf, useTrackerData } from '../tracker-data/useTrackerData';
import { toOpponentSummary } from '../tracker-data/mapping';
import { formatStreak } from '../tracker-data/format';
import type { Game, GameStats } from '../tracker-data/types';
import { Card, EmptyState, SectionHeader } from '../../components/ui/Card';
import { OpponentList } from './OpponentList';
import { OpponentQuickStats } from './OpponentQuickStats';
import { QuickStatsCard } from './QuickStatsCard';
import { StatMetricCard } from './StatMetricCard';
import { GameHistoryTable } from './GameHistoryTable';
import { AddOpponentDialog } from './AddOpponentDialog';
import { LogGameDialog } from './LogGameDialog';
import { GameDetailDialog } from './GameDetailDialog';

export function OtAnalyticsView() {
  const { opponents, games, dashboard, connection, online, refresh } = useTrackerData();
  const [notice, setNotice] = useState<string | null>(null);
  const [showAddOpponent, setShowAddOpponent] = useState(false);
  const [showLogGame, setShowLogGame] = useState(false);
  const [detailGameId, setDetailGameId] = useState<number | null>(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null);
  const [opponentSearchQuery, setOpponentSearchQuery] = useState('');

  const handleDeleteOpponent = async (id: number) => {
    const opponent = opponents.find((o) => o.id === id);
    if (!window.confirm(`Delete ${opponent?.name ?? 'this opponent'} and their games?`)) return;
    try {
      await api.deleteOpponent(id);
      if (selectedOpponentId === id) setSelectedOpponentId(null);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const handleAddOpponent = async (name: string, gamertag?: string) => {
    setShowAddOpponent(false);
    try {
      const created = await api.createOpponent({ name, gamertag });
      setSelectedOpponentId(created.id);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const handleLogGame = async (result: NewGameResult) => {
    // Errors propagate to the dialog, which stays open and shows them.
    await api.logGame(result);
    setShowLogGame(false);
    await refresh();
  };

  const handleDeleteGame = async (id: number) => {
    if (!window.confirm('Delete this game? Records and stats will be recalculated.')) return;
    try {
      await api.deleteGame(id);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const handleSaveStats = async (id: number, stats: GameStats | null) => {
    await api.updateGame(id, { stats });
    await refresh();
  };

  const detailGame: Game | null = games.find((game) => game.id === detailGameId) ?? null;
  const detailOpponentName = detailGame ? opponents.find((o) => o.id === detailGame.opponent_id)?.name ?? 'Opponent' : '';

  const selectedOpponent = opponents.find((o) => o.id === selectedOpponentId) ?? null;
  const selectedSummary = useMemo(
    () => (selectedOpponent ? toOpponentSummary(selectedOpponent, games) : null),
    [selectedOpponent, games],
  );

  const showsSampleData = online && dashboard.isSample;

  return (
    <div className="flex flex-col gap-4 p-5">
      {notice && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-inset border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
        >
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="rounded p-1 text-foreground-secondary hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {showsSampleData && (
        <div className="flex items-center gap-2 rounded-inset border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          Sample data — nothing tracked yet. Add an opponent or log a game to replace it.
        </div>
      )}

      {connection === 'loading' && <EmptyState title="Loading…" className="py-24" />}

      {connection === 'offline' && (
        <Card label="Tracker service offline" className="mx-auto max-w-xl items-center py-10 text-center">
          <ServerOff className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Tracker service is offline</h2>
          <p className="mt-1 max-w-sm text-sm text-foreground-secondary">
            Opponents and games are stored by the local HoopSync server. Start it and this page will
            reconnect on its own.
          </p>
          <code className="panel-inset mt-4 px-3 py-2 text-xs text-primary">pnpm dev:server</code>
        </Card>
      )}

      {online && (
        <>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLogGame(true)}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-primary-hover"
            >
              Log Game
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <OpponentList
              opponents={opponents}
              searchQuery={opponentSearchQuery}
              onSearchChange={setOpponentSearchQuery}
              onAddOpponent={() => setShowAddOpponent(true)}
              onSelectOpponent={(opponent) => setSelectedOpponentId(opponent.id)}
              selectedOpponentId={selectedOpponentId ?? undefined}
              onDeleteOpponent={handleDeleteOpponent}
              className="xl:col-span-7"
            />
            <OpponentQuickStats
              opponent={selectedSummary}
              emptyHint="Select an opponent from the list to view their stats."
              className="xl:col-span-5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <QuickStatsCard stats={dashboard.stats} className="xl:col-span-9" />
            <Card label="Current streak" className="xl:col-span-3">
              <SectionHeader title="Current Streak" />
              <StatMetricCard
                label={dashboard.stats.streak < 0 ? 'Losses in a row' : 'Wins in a row'}
                value={formatStreak(dashboard.stats.streak)}
                accent={dashboard.stats.streak > 0 ? 'success' : dashboard.stats.streak < 0 ? 'destructive' : 'neutral'}
                className="flex-1"
              />
            </Card>
            <GameHistoryTable
              games={dashboard.history}
              onSelectGame={dashboard.isSample ? undefined : (id) => setDetailGameId(id)}
              onDeleteGame={dashboard.isSample ? undefined : handleDeleteGame}
              className="xl:col-span-12"
            />
          </div>
        </>
      )}

      {showAddOpponent && <AddOpponentDialog onAdd={handleAddOpponent} onClose={() => setShowAddOpponent(false)} />}
      {showLogGame && (
        <LogGameDialog
          opponentNames={opponents.map((o) => o.name)}
          onSubmit={handleLogGame}
          onClose={() => setShowLogGame(false)}
        />
      )}
      {detailGame && (
        <GameDetailDialog
          game={detailGame}
          opponentName={detailOpponentName}
          onReadPhoto={(photo) => api.readStatsPhoto(detailGame.id, photo)}
          onSaveStats={(stats) => handleSaveStats(detailGame.id, stats)}
          onClose={() => setDetailGameId(null)}
        />
      )}
    </div>
  );
}
