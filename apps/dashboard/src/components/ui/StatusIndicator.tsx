import { cn } from '../../utils/cn';

export type ConnectionState = 'connected' | 'live' | 'disconnected';

const stateStyles: Record<ConnectionState, { dot: string; label: string; pulse: boolean; text: string }> = {
  connected: { dot: 'bg-success shadow-[0_0_8px_var(--success)]', label: 'Connected', pulse: false, text: 'text-success' },
  live: { dot: 'bg-success shadow-[0_0_8px_var(--success)]', label: 'Live', pulse: true, text: 'text-success' },
  disconnected: { dot: 'border border-muted-foreground bg-transparent', label: 'Not connected', pulse: false, text: 'text-muted-foreground' },
};

interface StatusIndicatorProps {
  state: ConnectionState;
  label?: string;
  className?: string;
}

export function StatusIndicator({ state, label, className }: StatusIndicatorProps) {
  const style = stateStyles[state];

  return (
    <span role="status" className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold', style.text, className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', style.dot, style.pulse && 'motion-safe:animate-pulse')} />
      {label ?? style.label}
    </span>
  );
}
