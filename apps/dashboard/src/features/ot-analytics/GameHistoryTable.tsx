import { Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { GameHistoryRow } from '../tracker-data/types';
import { formatDate, formatPercent } from '../tracker-data/format';
import { Card, SectionHeader, TextAction } from '../../components/ui/Card';

interface GameHistoryTableProps {
  games: GameHistoryRow[];
  /** Maximum rows to show; all rows when omitted */
  limit?: number;
  onViewAll?: () => void;
  /** Makes each opponent name open that game's details */
  onSelectGame?: (id: number) => void;
  /** Adds a delete action per row when provided */
  onDeleteGame?: (id: number) => void;
  className?: string;
}

const headCell = 'px-3 py-2 text-left text-xs font-medium text-foreground-secondary';
const cell = 'px-3 py-2 whitespace-nowrap';

export function GameHistoryTable({
  games,
  limit,
  onViewAll,
  onSelectGame,
  onDeleteGame,
  className,
}: GameHistoryTableProps) {
  const rows = limit ? games.slice(0, limit) : games;
  const columns = onDeleteGame ? 7 : 6;

  return (
    <Card label="Game history" className={className}>
      <SectionHeader
        title="Game History"
        action={onViewAll && <TextAction onClick={onViewAll}>View All</TextAction>}
      />

      <div className="panel-inset overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border-muted">
              <th scope="col" className={headCell}>Date</th>
              <th scope="col" className={headCell}>Opponent</th>
              <th scope="col" className={headCell}>Result</th>
              <th scope="col" className={headCell}>Score</th>
              <th scope="col" className={headCell}>Mode</th>
              <th scope="col" className={headCell}>W/L vs Opponent</th>
              {onDeleteGame && (
                <th scope="col" className={headCell}>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns} className="px-3 py-8 text-center text-sm text-foreground-secondary">
                  No games recorded yet
                </td>
              </tr>
            ) : (
              rows.map((game) => {
                const total = game.recordWins + game.recordLosses;
                const rate = total > 0 ? (game.recordWins / total) * 100 : 0;
                const isWin = game.result === 'win';

                return (
                  <tr
                    key={game.id}
                    className="border-b border-border-muted/60 transition-colors last:border-b-0 odd:bg-white/[0.025] hover:bg-primary/[0.06]"
                  >
                    <td className={cn(cell, 'text-foreground')}>{formatDate(game.date)}</td>
                    <td className={cn(cell, 'font-medium text-primary')}>
                      {onSelectGame ? (
                        <button
                          type="button"
                          onClick={() => onSelectGame(game.id)}
                          title="View game details"
                          className="rounded hover:underline"
                        >
                          {game.opponent}
                        </button>
                      ) : (
                        game.opponent
                      )}
                    </td>
                    <td className={cn(cell, 'font-bold', isWin ? 'text-success' : 'text-destructive')}>
                      <span aria-hidden="true">{isWin ? 'W' : 'L'}</span>
                      <span className="sr-only">{isWin ? 'Win' : 'Loss'}</span>
                    </td>
                    <td className={cn(cell, 'text-foreground')}>
                      {game.yourScore} - {game.opponentScore}
                    </td>
                    <td className={cn(cell, 'text-foreground-secondary')}>{game.mode}</td>
                    <td className={cn(cell, 'text-foreground')}>
                      {game.recordWins} - {game.recordLosses}
                      <span className="ml-2 text-foreground-secondary">({formatPercent(rate)})</span>
                    </td>
                    {onDeleteGame && (
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteGame(game.id)}
                          aria-label={`Delete game against ${game.opponent} on ${formatDate(game.date)}`}
                          title="Delete game"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
