import { cn } from '../../utils/cn';

const accentColors = {
  neutral: 'text-foreground',
  primary: 'text-primary',
  blue: 'text-accent-blue',
  success: 'text-success',
  destructive: 'text-destructive',
};

interface StatMetricCardProps {
  label: string;
  value: string | number;
  accent?: keyof typeof accentColors;
  className?: string;
}

export function StatMetricCard({ label, value, accent = 'neutral', className }: StatMetricCardProps) {
  return (
    <div className={cn('panel-inset flex flex-col items-center justify-center px-2 py-3 text-center', className)}>
      <div className="text-xs text-foreground-secondary">{label}</div>
      <div className={cn('mt-0.5 text-2xl font-bold tabular-nums leading-tight', accentColors[accent])}>
        {value}
      </div>
    </div>
  );
}
