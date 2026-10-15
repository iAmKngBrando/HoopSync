import type { GameSummaryStat } from '../types';
import { Card } from './ui/Card';

interface GameSummaryPanelProps {
  myScore: number;
  opponentScore: number;
  stats: GameSummaryStat[];
}

export function GameSummaryPanel({ myScore, opponentScore, stats }: GameSummaryPanelProps) {
  return (
    <Card>
      <div className="mb-4 text-[13px] font-bold tracking-wide text-foreground-secondary">GAME SUMMARY</div>

      <div className="mb-5 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-primary">{myScore}</div>
          <div className="text-[10px] font-semibold tracking-wide text-muted-foreground">MY TEAM</div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">VS</span>
        <div className="text-center">
          <div className="font-display text-3xl font-extrabold text-accent-blue">{opponentScore}</div>
          <div className="text-[10px] font-semibold tracking-wide text-muted-foreground">OPPONENT</div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {stats.map((stat) => {
          const total = stat.my + stat.opponent || 1;
          const myShare = (stat.my / total) * 100;
          return (
            <div key={stat.label} className="flex items-center gap-3 text-xs">
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-foreground">
                {stat.my}
                {stat.suffix ?? ''}
              </span>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${myShare}%` }} />
                </div>
                <span className="shrink-0 text-[10px] font-semibold tracking-wide text-muted-foreground">
                  {stat.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="ml-auto h-full rounded-full bg-accent-blue" style={{ width: `${100 - myShare}%` }} />
                </div>
              </div>
              <span className="w-10 shrink-0 font-semibold tabular-nums text-foreground">
                {stat.opponent}
                {stat.suffix ?? ''}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
