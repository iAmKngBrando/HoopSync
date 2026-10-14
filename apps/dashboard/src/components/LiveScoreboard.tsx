import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface LiveScoreboardProps {
  myScore: number;
  opponentScore: number;
  quarter: string;
  clock: string;
  shotClock: number;
  myFouls: number;
  myTimeouts: number;
  opponentFouls: number;
  opponentTimeouts: number;
  possession: 'my' | 'opponent';
  large?: boolean;
}

export function LiveScoreboard({
  myScore,
  opponentScore,
  quarter,
  clock,
  shotClock,
  myFouls,
  myTimeouts,
  opponentFouls,
  opponentTimeouts,
  possession,
  large,
}: LiveScoreboardProps) {
  const myShare = Math.round((myScore / (myScore + opponentScore)) * 100);

  return (
    <div className="relative overflow-hidden rounded-card">
      <div
        className="noise-dots absolute inset-y-0 left-0 w-1/3 opacity-20"
        style={{ WebkitMaskImage: 'linear-gradient(90deg, black, transparent)', maskImage: 'linear-gradient(90deg, black, transparent)' }}
      />
      <div
        className="noise-dots absolute inset-y-0 right-0 w-1/3 opacity-20"
        style={{ WebkitMaskImage: 'linear-gradient(-90deg, black, transparent)', maskImage: 'linear-gradient(-90deg, black, transparent)' }}
      />

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-8">
        <div className="text-center">
          <div className="text-sm font-bold tracking-wide text-primary">MY TEAM</div>
          <div className={cn('font-display font-extrabold tabular-nums text-foreground', large ? 'text-7xl' : 'text-6xl')}>
            {myScore}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="panel-inset flex flex-col items-center gap-1 px-6 py-3">
            <span className="text-[11px] font-semibold tracking-wide text-foreground-secondary">{quarter}</span>
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">{clock}</span>
          </div>
          <span className="rounded-md bg-primary/15 px-2.5 py-0.5 text-sm font-bold text-primary">{shotClock}</span>
        </div>

        <div className="text-center">
          <div className="text-sm font-bold tracking-wide text-accent-blue">OPPONENT</div>
          <div className={cn('font-display font-extrabold tabular-nums text-foreground', large ? 'text-7xl' : 'text-6xl')}>
            {opponentScore}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 text-xs text-foreground-secondary">
        <span>
          FOULS: <span className="font-semibold text-foreground">{myFouls}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          TIMEOUTS: <span className="font-semibold text-foreground">{myTimeouts}</span>
        </span>
        <span>
          FOULS: <span className="font-semibold text-foreground">{opponentFouls}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          TIMEOUTS: <span className="font-semibold text-foreground">{opponentTimeouts}</span>
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-3 px-6 pb-6">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${myShare}%` }} />
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold tracking-wide text-foreground-secondary">
          POSS <ChevronRight size={12} className={possession === 'my' ? 'text-primary' : 'text-accent-blue'} />
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="ml-auto h-full rounded-full bg-accent-blue" style={{ width: `${100 - myShare}%` }} />
        </div>
      </div>
    </div>
  );
}
