import { cn } from '../../utils/cn';
import type { OpponentSummary } from '../tracker-data/types';
import { formatDate, formatOverallAndBuild, formatStreak } from '../tracker-data/format';
import { Avatar } from '../tracker-data/ui/Avatar';
import { WinRateRing } from '../tracker-data/ui/WinRateRing';
import { Card, EmptyState, SectionHeader } from '../../components/ui/Card';

interface OpponentQuickStatsProps {
  opponent: OpponentSummary | null;
  /** Hint shown when no opponent is available */
  emptyHint?: string;
  className?: string;
}

export function OpponentQuickStats({
  opponent,
  emptyHint = 'Stats appear once an opponent has been detected.',
  className,
}: OpponentQuickStatsProps) {
  if (!opponent) {
    return (
      <Card label="Opponent quick stats" className={className}>
        <SectionHeader title="Opponent Quick Stats" />
        <EmptyState title="No opponent selected" hint={emptyHint} className="flex-1" />
      </Card>
    );
  }

  const subtitle = formatOverallAndBuild(opponent.overall, opponent.build, opponent.level) || opponent.gamertag;
  const streakTone =
    (opponent.streak ?? 0) > 0
      ? 'text-success'
      : (opponent.streak ?? 0) < 0
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <Card label="Opponent quick stats" className={className}>
      <SectionHeader title="Opponent Quick Stats" />

      <div className="flex items-center gap-3 border-b border-border-muted pb-3">
        <Avatar name={opponent.name} src={opponent.avatarUrl} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-foreground">{opponent.name}</div>
          {subtitle && <div className="truncate text-xs text-foreground-secondary">{subtitle}</div>}
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-around gap-x-6 gap-y-4 pt-4">
        <WinRateRing wins={opponent.wins} losses={opponent.losses} winRate={opponent.winRate} />

        <dl className="grid gap-3">
          <div>
            <dt className="text-xs text-foreground-secondary">Last Played</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {formatDate(opponent.lastPlayed, 'Never')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-secondary">Last Result</dt>
            <dd
              className={cn(
                'text-sm font-semibold',
                opponent.lastResult === 'win' && 'text-success',
                opponent.lastResult === 'loss' && 'text-destructive',
              )}
            >
              {opponent.lastResult === 'win' ? 'Win' : opponent.lastResult === 'loss' ? 'Loss' : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-secondary">Streak</dt>
            <dd className={cn('text-sm font-semibold tabular-nums', streakTone)}>
              {formatStreak(opponent.streak)}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
