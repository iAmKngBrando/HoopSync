import { cn } from '../../utils/cn';
import type { OpponentSummary } from '../tracker-data/types';
import { formatPercent } from '../tracker-data/format';
import { Avatar } from '../tracker-data/ui/Avatar';
import { Card, EmptyState, SectionHeader, TextAction } from '../../components/ui/Card';

interface RecentOpponentsListProps {
  opponents: OpponentSummary[];
  onViewAll?: () => void;
  className?: string;
}

export function RecentOpponentsList({ opponents, onViewAll, className }: RecentOpponentsListProps) {
  return (
    <Card label="Recent opponents" className={className}>
      <SectionHeader
        title="Recent Opponents"
        action={onViewAll && <TextAction onClick={onViewAll}>View All</TextAction>}
      />

      {opponents.length === 0 ? (
        <EmptyState title="No recent opponents" hint="Opponents you play will be listed here." />
      ) : (
        <ul className="divide-y divide-border-muted">
          {opponents.map((opponent) => (
            <li
              key={opponent.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto_3rem] items-center gap-3 py-1.5 text-sm"
            >
              <Avatar name={opponent.name} src={opponent.avatarUrl} size="sm" />
              <span className="truncate font-medium text-foreground">{opponent.name}</span>
              <span className="tabular-nums text-foreground-secondary">
                {opponent.wins} - {opponent.losses}
              </span>
              <span
                className={cn(
                  'text-right font-semibold tabular-nums',
                  opponent.wins + opponent.losses === 0
                    ? 'text-foreground-secondary'
                    : opponent.winRate >= 50
                      ? 'text-success'
                      : 'text-destructive',
                )}
              >
                {opponent.wins + opponent.losses === 0 ? '—' : formatPercent(opponent.winRate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
