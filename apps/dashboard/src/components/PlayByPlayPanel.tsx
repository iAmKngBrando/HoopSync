import { cn } from '../utils/cn';
import type { PlayByPlayEvent } from '../types';
import { Card, SectionHeader, TextAction } from './ui/Card';

const dotColor: Record<PlayByPlayEvent['team'], string> = {
  my: 'bg-primary',
  opponent: 'bg-accent-blue',
  neutral: 'bg-muted-foreground',
};

const nameColor: Record<PlayByPlayEvent['team'], string> = {
  my: 'text-primary',
  opponent: 'text-accent-blue',
  neutral: 'text-foreground-secondary',
};

export function PlayByPlayPanel({ events }: { events: PlayByPlayEvent[] }) {
  return (
    <Card>
      <SectionHeader title="LIVE PLAY BY PLAY" action={<TextAction>VIEW ALL</TextAction>} />
      <ul className="flex flex-col gap-2.5">
        {events.map((event) => (
          <li key={event.id} className="flex items-start gap-2.5 text-[13px]">
            <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', dotColor[event.team])} />
            <span className="w-11 shrink-0 font-mono text-xs text-muted-foreground">{event.time}</span>
            <span className="min-w-0 leading-snug text-foreground-secondary">
              <span className={cn('font-semibold', nameColor[event.team])}>{event.player}</span>{' '}
              {event.description}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
