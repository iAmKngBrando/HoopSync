import type { MatchupCapture } from '../tracker-data/types';
import { Card, SectionHeader } from '../../components/ui/Card';
import { MatchupPlate, PlayerSilhouette, VsMark } from '../tracker-data/ui/Matchup';
import { FrameCaption, ScreenshotFrame } from '../tracker-data/ui/ScreenshotFrame';

interface MatchupPreviewCardProps {
  /** Upcoming or prospective opponent */
  matchup: MatchupCapture | null;
  className?: string;
}

export function MatchupPreviewCard({ matchup, className }: MatchupPreviewCardProps) {
  return (
    <Card label="Matchup preview" className={className}>
      <SectionHeader title="Matchup Preview" note="(next game)" />

      <ScreenshotFrame
        src={matchup?.frame.imageUrl}
        alt="Next matchup preview"
        aspectClassName="aspect-[16/7]"
      >
        {matchup ? (
          <div className="grid h-full grid-cols-[1fr_auto_auto] grid-rows-[minmax(0,1fr)] items-center gap-3 p-3">
            <div className="flex h-full min-w-0 items-end gap-2">
              <PlayerSilhouette className="hidden w-[20cqw] text-accent-blue/55 @md:block" />
              <MatchupPlate
                player={matchup.opponent}
                tag="Opponent Matchup"
                size="sm"
                className="max-w-48 flex-1 self-center"
              />
            </div>
            <VsMark className="text-3xl" />
            <div className="flex aspect-[3/4] w-[17cqw] min-w-16 flex-col items-center justify-end overflow-hidden rounded-md border border-primary/40 bg-background/70 pb-1">
              <PlayerSilhouette className="w-[72%] text-primary/50" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
                You
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="text-sm font-medium text-foreground">No upcoming matchup</div>
            <p className="mt-1 text-xs text-foreground-secondary">
              Your next opponent will preview here when detected.
            </p>
          </div>
        )}
      </ScreenshotFrame>

      <FrameCaption capturedAt={matchup?.frame.capturedAt} label={matchup?.frame.label ?? 'Matchup Screen'} />
    </Card>
  );
}
