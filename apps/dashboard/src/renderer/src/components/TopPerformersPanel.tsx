import type { TopPerformer } from '../types';
import { Card, SectionHeader, TextAction } from './ui/Card';
import { Avatar } from './ui/Avatar';

const palette = ['#8b5cf6', '#3b82f6', '#a855f7'];

export function TopPerformersPanel({ performers }: { performers: TopPerformer[] }) {
  return (
    <Card>
      <SectionHeader title="TOP PERFORMERS" action={<TextAction>VIEW ALL</TextAction>} />
      <ul className="flex flex-col gap-3">
        {performers.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-4 text-center text-xs font-bold text-muted-foreground">{p.rank}</span>
            <Avatar name={p.name} color={palette[(p.rank - 1) % palette.length] ?? '#64748b'} isMvp={p.isMvp} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{p.name}</span>
            <span className="flex gap-3 text-xs text-foreground-secondary">
              <span>
                <b className="text-foreground">{p.pts}</b> PTS
              </span>
              <span>
                <b className="text-foreground">{p.reb}</b> REB
              </span>
              <span>
                <b className="text-foreground">{p.ast}</b> AST
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
