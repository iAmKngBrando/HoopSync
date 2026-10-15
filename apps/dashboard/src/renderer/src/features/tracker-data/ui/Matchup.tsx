import { cn } from '../../../utils/cn';
import type { PlayerIdentity } from '../types';

interface PlayerSilhouetteProps {
  className?: string;
}

/** Generic player stand-in; never a real or licensed likeness. */
export function PlayerSilhouette({ className }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 150"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
      className={cn('aspect-[4/5] w-[20cqw] shrink-0', className)}
      fill="currentColor"
    >
      <circle cx="60" cy="40" r="25" />
      <path d="M8 150c0-40 21-66 52-66s52 26 52 66z" />
    </svg>
  );
}

interface MatchupPlateProps {
  player: PlayerIdentity;
  /** Small ribbon above the plate, e.g. "Your Matchup" */
  tag?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Translucent name plate laid over a matchup frame. */
export function MatchupPlate({ player, tag, size = 'md', className }: MatchupPlateProps) {
  return (
    <div className={cn('min-w-28', className)}>
      {tag && (
        <span className="mb-1 inline-block -skew-x-6 rounded-sm bg-gradient-to-r from-accent-blue to-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
          {tag}
        </span>
      )}
      <div className={cn('plate rounded-md', size === 'md' ? 'px-3 py-2' : 'px-2.5 py-1.5')}>
        <div
          className={cn(
            'truncate font-bold leading-tight text-foreground',
            size === 'md' ? 'text-base @lg:text-lg' : 'text-sm',
          )}
        >
          {player.name}
        </div>
        {player.overall !== undefined && (
          <div
            className={cn(
              'font-semibold leading-tight text-foreground',
              size === 'md' ? 'text-sm @lg:text-base' : 'text-xs',
            )}
          >
            OVR {player.overall}
          </div>
        )}
        {player.build && (
          <div className="mt-0.5 truncate text-[11px] text-foreground-secondary">{player.build}</div>
        )}
        {player.vitals && (
          <div className="truncate text-[10px] text-muted-foreground">{player.vitals}</div>
        )}
      </div>
    </div>
  );
}

interface VsMarkProps {
  className?: string;
}

export function VsMark({ className }: VsMarkProps) {
  return (
    <span aria-label="versus" className={cn('vs-mark select-none text-3xl', className)}>
      VS
    </span>
  );
}
