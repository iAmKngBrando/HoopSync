import { cn } from '../utils/cn';
import type { SessionHistoryEntry } from '../types';
import { Card, SectionHeader } from './ui/Card';
import { Avatar } from './ui/Avatar';

const colors = ['#8b5cf6', '#3b82f6', '#a855f7', '#f97316'];

interface SessionHistoryPanelProps {
  sessions: SessionHistoryEntry[];
  className?: string;
}

export function SessionHistoryPanel({ sessions, className }: SessionHistoryPanelProps) {
  return (
    <Card className={className}>
      <SectionHeader title="SESSION HISTORY" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-[10px] font-semibold tracking-wide text-muted-foreground">
              <th className="pb-2 text-left">DATE</th>
              <th className="pb-2 text-left">MATCH</th>
              <th className="pb-2 text-left">PLAYERS</th>
              <th className="pb-2 text-left">RESULT</th>
              <th className="pb-2 text-left">SCORE</th>
              <th className="pb-2 text-left">DURATION</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-border-soft">
                <td className="py-2 pr-2 text-foreground-secondary">{s.date}</td>
                <td className="py-2 pr-2 font-medium text-foreground">{s.match}</td>
                <td className="py-2 pr-2">
                  <div className="flex -space-x-2">
                    {s.players.map((p, i) => (
                      <div key={p} className="rounded-full ring-2 ring-background">
                        <Avatar name={p} color={colors[i % colors.length] ?? '#64748b'} size={22} />
                      </div>
                    ))}
                  </div>
                </td>
                <td className={cn('py-2 pr-2 font-semibold', s.result === 'Win' ? 'text-success' : 'text-primary')}>
                  {s.result}
                </td>
                <td className="py-2 pr-2 tabular-nums text-foreground-secondary">{s.score}</td>
                <td className="py-2 tabular-nums text-foreground-secondary">{s.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
