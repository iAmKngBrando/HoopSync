import { Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Opponent } from '../tracker-data/types';
import { formatPercent } from '../tracker-data/format';
import { Avatar } from '../tracker-data/ui/Avatar';
import { Card, EmptyState, SectionHeader } from '../../components/ui/Card';

interface OpponentListProps {
  opponents: Opponent[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddOpponent: () => void;
  onSelectOpponent: (opponent: Opponent) => void;
  selectedOpponentId?: number;
  onDeleteOpponent: (id: number) => void;
  className?: string;
}

export function OpponentList({
  opponents,
  searchQuery,
  onSearchChange,
  onAddOpponent,
  onSelectOpponent,
  selectedOpponentId,
  onDeleteOpponent,
  className,
}: OpponentListProps) {
  const query = searchQuery.toLowerCase();
  const filteredOpponents = opponents.filter(
    (opponent) =>
      opponent.name.toLowerCase().includes(query) ||
      (opponent.gamertag && opponent.gamertag.toLowerCase().includes(query)),
  );

  return (
    <Card label="Opponents" className={className}>
      <SectionHeader
        title="Opponents"
        note={opponents.length > 0 ? `(${opponents.length})` : undefined}
        action={
          <button
            type="button"
            onClick={onAddOpponent}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add
          </button>
        }
      />

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Search opponents"
          placeholder="Search opponents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-border-muted bg-inset py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filteredOpponents.length === 0 ? (
        <EmptyState
          title={opponents.length === 0 ? 'No opponents yet' : 'No opponents found'}
          hint={
            opponents.length === 0
              ? 'Add an opponent to start tracking your record against them.'
              : 'Try a different name or gamertag.'
          }
        />
      ) : (
        <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
          {filteredOpponents.map((opponent) => {
            const isSelected = selectedOpponentId === opponent.id;
            const hasGames = opponent.total_games > 0;

            return (
              <li
                key={opponent.id}
                className={cn(
                  'group flex items-center gap-1 rounded-lg border transition-colors',
                  isSelected
                    ? 'border-primary/30 bg-primary/10'
                    : 'border-transparent hover:bg-white/5',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectOpponent(opponent)}
                  aria-pressed={isSelected}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-2 text-left"
                >
                  <Avatar name={opponent.name} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {opponent.name}
                    </span>
                    <span className="block truncate text-xs text-foreground-secondary">
                      {opponent.gamertag ? `${opponent.gamertag} · ` : ''}
                      {opponent.wins} - {opponent.losses}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      !hasGames
                        ? 'text-foreground-secondary'
                        : opponent.win_rate >= 50
                          ? 'text-success'
                          : 'text-destructive',
                    )}
                  >
                    {hasGames ? formatPercent(opponent.win_rate) : '—'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteOpponent(opponent.id)}
                  aria-label={`Delete ${opponent.name}`}
                  title="Delete opponent"
                  className="mr-1.5 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
