import { Maximize2, Play } from 'lucide-react';
import { minimalRosterCards } from '../data/mockData';
import { LiveScoreboard } from './LiveScoreboard';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';
import type { ViewMode } from '../types';

interface MinimalDashboardProps {
  onViewModeChange: (mode: ViewMode) => void;
}

export function MinimalDashboard({ onViewModeChange }: MinimalDashboardProps) {
  return (
    <div className="app-bg flex h-screen flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-4 px-6">
        <span className="brand-mark text-xl">
          <span className="text-primary">Hoop</span>
          <span className="text-foreground">Sync</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success">
          <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
          LIVE SESSION
        </span>
        <span className="text-sm font-medium text-foreground-secondary">MyPark Run – 5v5</span>
        <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
          LIVE
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-5xl">
          <LiveScoreboard
            myScore={63}
            opponentScore={48}
            quarter="4TH QUARTER"
            clock="1:24"
            shotClock={24}
            myFouls={2}
            myTimeouts={1}
            opponentFouls={3}
            opponentTimeouts={1}
            possession="opponent"
            large
          />
        </div>

        <div className="mt-8 grid w-full max-w-5xl grid-cols-4 gap-3 sm:grid-cols-8">
          {minimalRosterCards.map((player) => (
            <div
              key={player.id}
              className={cn(
                'glass flex flex-col items-center gap-2 rounded-card px-2 py-3 text-center',
                player.isSelf && 'border-primary/60 shadow-[0_0_0_1px_var(--primary)]',
              )}
            >
              <Avatar name={player.name} color={player.avatarColor} isMvp={player.isMvp} size={40} />
              <span className="w-full truncate text-xs font-semibold text-foreground">{player.name}</span>
              <div className="flex gap-2 text-[11px] text-foreground-secondary">
                <span>
                  <b className="text-foreground">{player.pts}</b> PTS
                </span>
                <span>
                  <b className="text-foreground">{player.reb}</b> REB
                </span>
                <span>
                  <b className="text-foreground">{player.ast}</b> AST
                </span>
              </div>
              {player.live && <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />}
            </div>
          ))}
        </div>
      </main>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border-soft px-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground-secondary">
          <Play size={13} className="text-muted-foreground" />
          Elgato HD60 X
          <span className="text-success">Connected</span>
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
