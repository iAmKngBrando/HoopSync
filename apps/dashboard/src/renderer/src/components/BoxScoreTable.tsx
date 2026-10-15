import { cn } from '../utils/cn';
import type { BoxScoreRow } from '../types';

interface BoxScoreTableProps {
  title: string;
  accent: 'primary' | 'blue';
  rows: BoxScoreRow[];
  totals: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fgMade: number;
    fgAtt: number;
    tpMade: number;
    tpAtt: number;
    to: number;
    plusMinus: number;
  };
}

const columns = [
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'fg', label: 'FG' },
  { key: 'tp', label: '3PT' },
  { key: 'to', label: 'TO' },
  { key: 'plusMinus', label: '+/-' },
] as const;

export function BoxScoreTable({ title, accent, rows, totals }: BoxScoreTableProps) {
  const accentText = accent === 'primary' ? 'text-primary' : 'text-accent-blue';

  return (
    <div className="glass rounded-card p-4">
      <div className={cn('mb-3 text-[13px] font-bold tracking-wide', accentText)}>{title}</div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] text-[13px]">
          <thead>
            <tr className="text-[10px] font-semibold tracking-wide text-muted-foreground">
              <th className="pb-2 pr-2 text-left">PLAYER</th>
              {columns.map((col) => (
                <th key={col.key} className="pb-2 text-right">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn('border-t border-border-soft', row.highlight && 'bg-primary/8')}
              >
                <td className="truncate py-1.5 pr-2 font-medium text-foreground">{row.name}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums text-foreground">{row.pts}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">{row.reb}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">{row.ast}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">{row.stl}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">{row.blk}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">
                  {row.fgMade}/{row.fgAtt}
                </td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">
                  {row.tpMade}/{row.tpAtt}
                </td>
                <td className="py-1.5 text-right tabular-nums text-foreground-secondary">{row.to}</td>
                <td
                  className={cn(
                    'py-1.5 text-right tabular-nums font-semibold',
                    row.plusMinus > 0 ? 'text-success' : row.plusMinus < 0 ? 'text-primary' : 'text-foreground-secondary',
                  )}
                >
                  {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border pt-1 font-bold text-foreground">
              <td className="py-1.5 pr-2">TOTAL</td>
              <td className="py-1.5 text-right tabular-nums">{totals.pts}</td>
              <td className="py-1.5 text-right tabular-nums">{totals.reb}</td>
              <td className="py-1.5 text-right tabular-nums">{totals.ast}</td>
              <td className="py-1.5 text-right tabular-nums">{totals.stl}</td>
              <td className="py-1.5 text-right tabular-nums">{totals.blk}</td>
              <td className="py-1.5 text-right tabular-nums">
                {totals.fgMade}/{totals.fgAtt}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {totals.tpMade}/{totals.tpAtt}
              </td>
              <td className="py-1.5 text-right tabular-nums">{totals.to}</td>
              <td className={cn('py-1.5 text-right tabular-nums', totals.plusMinus > 0 ? 'text-success' : 'text-primary')}>
                {totals.plusMinus > 0 ? `+${totals.plusMinus}` : totals.plusMinus}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
