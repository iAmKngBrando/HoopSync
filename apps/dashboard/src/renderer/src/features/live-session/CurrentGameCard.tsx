import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { CurrentGame, GameStatus, MatchupHistoryEntry } from '../tracker-data/types';
import { formatDate } from '../tracker-data/format';
import { Card, SectionHeader } from '../../components/ui/Card';
import { MatchupPlate, PlayerSilhouette, VsMark } from '../tracker-data/ui/Matchup';
import { ScreenshotFrame } from '../tracker-data/ui/ScreenshotFrame';

const statusLabels: Record<GameStatus, string> = {
  live: 'Game in Progress',
  ended: 'Game Ended',
  upcoming: 'Up Next',
};

const statusTone: Record<GameStatus, string> = {
  live: 'text-success',
  ended: 'text-foreground-secondary',
  upcoming: 'text-primary',
};

const navButtonClass =
  'flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background/75 text-foreground-secondary backdrop-blur-sm transition-colors hover:text-foreground';

interface CurrentGameCardProps {
  /** The game in progress; an "awaiting matchup" state is shown when null */
  game: CurrentGame | null;
  /** Past games' captured matchup screens, newest first - lets this card step
   * back through recent opponents instead of only ever showing the live one. */
  history?: MatchupHistoryEntry[];
  className?: string;
}

export function CurrentGameCard({ game, history = [], className }: CurrentGameCardProps) {
  // null = showing the live game; an index into `history` otherwise (0 = most recent past game).
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const viewing = viewIndex !== null ? (history[viewIndex] ?? null) : null;

  // A real captured matchup frame already shows both players; don't draw over it.
  const hasImage = Boolean(game?.frame?.imageUrl);
  const canGoBack = viewIndex === null ? history.length > 0 : viewIndex < history.length - 1;
  const canGoForward = viewIndex !== null;

  const goBack = () => setViewIndex((i) => (i === null ? 0 : Math.min(i + 1, history.length - 1)));
  const goForward = () => setViewIndex((i) => (i === null || i === 0 ? null : i - 1));

  return (
    <Card label="Current game" className={className}>
      <SectionHeader title="Current Game" />

      <ScreenshotFrame
        src={viewing ? viewing.frameUrl : game?.frame?.imageUrl}
        alt={viewing ? `Matchup vs ${viewing.opponentName}` : 'Current matchup'}
        aspectClassName="aspect-[16/9] @2xl:aspect-[16/7]"
        className="flex-1"
      >
        {viewing || (game && hasImage) ? null : game ? (
          <div className="grid h-full grid-cols-[1fr_auto_1fr] grid-rows-[minmax(0,1fr)] items-center gap-3 px-3 pb-12 pt-3 @lg:gap-5 @lg:px-5">
            {/* Opponent side */}
            <div className="flex h-full min-w-0 items-end gap-3">
              <PlayerSilhouette className="hidden w-[19cqw] text-accent-blue/55 drop-shadow-[0_0_18px_rgba(59,130,246,0.45)] @lg:block" />
              <MatchupPlate
                player={game.opponent}
                tag="Your Matchup"
                className="mb-1 max-w-56 flex-1 self-center"
              />
            </div>

            <VsMark className="text-4xl @lg:text-5xl" />

            {/* Your side */}
            <div className="flex h-full min-w-0 items-end justify-end gap-3">
              <div className="mb-1 self-center text-right">
                <div className="eyebrow">Your team</div>
                <div className="text-base font-bold text-foreground @lg:text-lg">
                  {game.yourLabel ?? 'You'}
                </div>
              </div>
              <PlayerSilhouette className="hidden w-[19cqw] text-primary/45 drop-shadow-[0_0_18px_rgba(139,92,246,0.4)] @lg:block" />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 pb-10 text-center">
            <div className="text-lg font-semibold text-foreground">
              {history.length > 0 ? 'No game in progress' : 'Awaiting matchup'}
            </div>
            <p className="mt-1 max-w-sm text-xs text-foreground-secondary">
              {history.length > 0
                ? 'Browse recent matchups with the arrows below, or wait for the next one.'
                : 'Opponent details will appear here once a matchup screen is captured.'}
            </p>
          </div>
        )}

        {/* Status bar: game state (or, when browsing, which past matchup this is) plus
            history navigation - score/clock live in LiveScoreboard, right above this
            card, so repeating them here would just be noise. */}
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 px-3">
          {canGoBack && (
            <button type="button" onClick={goBack} aria-label="Previous matchup" className={navButtonClass}>
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
          )}

          <div className="flex items-center rounded-full border border-border bg-background/75 text-sm backdrop-blur-sm">
            <span
              className={cn(
                'px-4 py-1.5 text-xs font-semibold',
                viewing ? 'text-foreground-secondary' : game ? statusTone[game.status] : 'text-foreground-secondary',
              )}
            >
              {viewing
                ? `vs ${viewing.opponentName} · ${formatDate(viewing.date)}`
                : game
                  ? statusLabels[game.status]
                  : 'No game detected'}
            </span>
          </div>

          {canGoForward && (
            <button type="button" onClick={goForward} aria-label="Back to current" className={navButtonClass}>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </ScreenshotFrame>
    </Card>
  );
}
