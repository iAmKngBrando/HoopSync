import { cn } from '../../utils/cn';
import type { CurrentGame, GameStatus } from '../tracker-data/types';
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

interface CurrentGameCardProps {
  /** The game in progress; an "awaiting matchup" state is shown when null */
  game: CurrentGame | null;
  className?: string;
}

export function CurrentGameCard({ game, className }: CurrentGameCardProps) {
  const hasScore = game?.yourScore !== undefined && game?.opponentScore !== undefined;
  // A real captured matchup frame already shows both players; don't draw over it.
  const hasImage = Boolean(game?.frame?.imageUrl);
  const hasClock = game?.quarter !== undefined || game?.clock !== undefined;

  return (
    <Card label="Current game" className={className}>
      <SectionHeader title="Current Game" />

      <ScreenshotFrame
        src={game?.frame?.imageUrl}
        alt="Current matchup"
        aspectClassName="aspect-[16/9] @2xl:aspect-[16/7]"
        className="flex-1"
      >
        {game && hasImage ? null : game ? (
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
              <PlayerSilhouette className="hidden w-[19cqw] text-primary/45 drop-shadow-[0_0_18px_rgba(239,59,59,0.4)] @lg:block" />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 pb-10 text-center">
            <div className="text-lg font-semibold text-foreground">Awaiting matchup</div>
            <p className="mt-1 max-w-sm text-xs text-foreground-secondary">
              Opponent details will appear here once a matchup screen is captured.
            </p>
          </div>
        )}

        {/* Status bar: game state, quarter and clock */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
          <div className="flex items-center divide-x divide-border-soft rounded-full border border-border bg-background/75 text-sm backdrop-blur-sm">
            <span
              className={cn(
                'px-4 py-1.5 text-xs font-semibold',
                game ? statusTone[game.status] : 'text-foreground-secondary',
              )}
            >
              {game ? statusLabels[game.status] : 'No game detected'}
            </span>
            {hasScore && (
              <span
                className="px-4 py-1.5 font-semibold tabular-nums text-foreground"
                aria-label={`You ${game.yourScore}, opponent ${game.opponentScore}`}
              >
                <span className="mr-1.5 text-xs font-medium text-foreground-secondary">You</span>
                <span className="text-primary">{game.yourScore}</span>
                <span className="mx-1.5 text-muted-foreground">-</span>
                <span className="text-accent-blue">{game.opponentScore}</span>
              </span>
            )}
            {(hasClock || !hasScore) && (
              <span className="flex items-center gap-2 px-4 py-1.5 font-semibold tabular-nums text-foreground">
                <span>{game?.quarter ? `Q${game.quarter}` : 'Q–'}</span>
                <span>{game?.clock ?? '--:--'}</span>
              </span>
            )}
          </div>
        </div>
      </ScreenshotFrame>
    </Card>
  );
}
