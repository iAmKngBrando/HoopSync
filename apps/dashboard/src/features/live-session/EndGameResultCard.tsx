import { cn } from '../../utils/cn';
import type { EndGameResult } from '../tracker-data/types';
import { Card, SectionHeader } from '../../components/ui/Card';
import { FrameCaption, ScreenshotFrame } from '../tracker-data/ui/ScreenshotFrame';

interface EndGameResultCardProps {
  /** Result of the most recently finished game */
  result: EndGameResult | null;
  className?: string;
}

export function EndGameResultCard({ result, className }: EndGameResultCardProps) {
  const isWin = result?.outcome === 'win';

  return (
    <Card label="End game result" className={className}>
      <SectionHeader title="End Game Result" note="(captured)" />

      <ScreenshotFrame src={result?.frame.imageUrl} alt="End of game screen capture" scene="court">
        {result ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
            <div className="rounded-md border border-white/10 bg-background/80 px-5 py-1.5 text-center backdrop-blur-sm">
              <div
                className={cn(
                  'text-xs font-bold uppercase tracking-[0.18em]',
                  isWin ? 'text-success' : 'text-destructive',
                )}
              >
                {isWin ? 'You Won' : 'You Lost'}
              </div>
              <div className="text-2xl font-bold tabular-nums leading-tight text-foreground @sm:text-3xl">
                {result.yourScore} - {result.opponentScore}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-white/10 bg-background/80 px-4 py-1.5 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-[9px] font-semibold uppercase tracking-widest text-primary">
                  Your Team
                </div>
                <div className="text-xl font-bold tabular-nums leading-tight text-foreground">
                  {result.yourScore}
                </div>
              </div>
              <span className="vs-mark text-sm">VS</span>
              <div className="text-center">
                <div className="text-[9px] font-semibold uppercase tracking-widest text-accent-blue">
                  Opponent
                </div>
                <div className="text-xl font-bold tabular-nums leading-tight text-foreground">
                  {result.opponentScore}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-foreground-secondary">
            No end game screen captured yet
          </div>
        )}
      </ScreenshotFrame>

      <FrameCaption capturedAt={result?.frame.capturedAt} label={result?.frame.label ?? 'End Game Screen'} />
    </Card>
  );
}
