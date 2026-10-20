import { Maximize2, Play } from 'lucide-react';
import { LiveScoreboard } from './LiveScoreboard';
import { PlayerStatCards } from './PlayerStatCards';
import { StatusIndicator } from './ui/StatusIndicator';
import { useTrackerDataContext } from '../features/tracker-data/TrackerDataContext';
import { captureStatus } from '../features/tracker-data/captureStatus';
import { useFriendsRoster } from '../features/friends/useFriendsRoster';
import type { ViewMode } from '../types';

interface MinimalDashboardProps {
  onViewModeChange: (mode: ViewMode) => void;
}

export function MinimalDashboard({ onViewModeChange }: MinimalDashboardProps) {
  const { dashboard, connection, captureState } = useTrackerDataContext();
  const friends = useFriendsRoster();

  const game = dashboard.currentGame;
  const isLive = game?.status === 'live';
  const status = captureStatus(connection, captureState);

  return (
    <div className="app-bg flex h-screen flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-4 px-6">
        <span className="brand-mark text-xl">
          <span className="text-primary">Hoop</span>
          <span className="text-foreground">Sync</span>
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success">
            <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
            LIVE SESSION
          </span>
        )}
        <span className="text-sm font-medium text-foreground-secondary">
          {game ? `vs ${game.opponent.name}` : 'No game in progress'}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
            <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
            LIVE
          </span>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-5xl">
          <LiveScoreboard
            myScore={game?.yourScore ?? 0}
            opponentScore={game?.opponentScore ?? 0}
            quarter={game?.quarter ? `Q${game.quarter}` : undefined}
            clock={game?.clock}
            large
          />
        </div>

        {friends.enabled && friends.players.length > 0 && (
          <div className="mt-8 w-full max-w-5xl">
            <PlayerStatCards players={friends.players} compact />
          </div>
        )}
      </main>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border-soft px-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground-secondary">
          <Play size={13} className="text-muted-foreground" />
          Elgato HD60 X
          <StatusIndicator state={status.state} label={status.label} />
        </span>

        <button
          type="button"
          onClick={() => onViewModeChange('full')}
          className="flex items-center gap-1.5 rounded-full border border-border-soft bg-inset px-3.5 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:border-border hover:text-foreground"
        >
          FULL DASHBOARD
          <Maximize2 size={13} />
        </button>
      </footer>
    </div>
  );
}
