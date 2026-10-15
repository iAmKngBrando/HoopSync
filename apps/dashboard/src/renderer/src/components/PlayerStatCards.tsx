import { cn } from '../utils/cn';
import type { PlayerSummary } from '../types';
import { Avatar } from './ui/Avatar';

interface PlayerStatCardsProps {
  players: PlayerSummary[];
  compact?: boolean;
}

export function PlayerStatCards({ players, compact }: PlayerStatCardsProps) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-2 lg:grid-cols-4')}>
      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            'glass flex flex-col gap-3 rounded-card p-3.5',
            player.isSelf && 'border-primary/60 shadow-[0_0_0_1px_var(--primary)]',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar name={player.name} color={player.avatarColor} isMvp={player.isMvp} size={compact ? 34 : 40} />
              <span className="truncate text-sm font-semibold text-foreground">{player.name}</span>
            </div>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground-secondary">
              {player.position}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Stat label="PTS" value={player.pts} />
              <Stat label="REB" value={player.reb} />
              <Stat label="AST" value={player.ast} />
            </div>
          </div>

          {player.live && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-success">
              <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="leading-tight">
      <div className="font-display text-xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] font-semibold tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
