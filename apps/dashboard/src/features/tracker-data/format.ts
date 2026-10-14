import { format, isValid, parseISO } from 'date-fns';

export function formatDate(value?: string | null, fallback = '—'): string {
  if (!value) return fallback;
  const date = parseISO(value);
  return isValid(date) ? format(date, 'yyyy-MM-dd') : fallback;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatStreak(streak?: number): string {
  if (!streak) return '—';
  return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
}

export function formatOverallAndBuild(overall?: number, build?: string, level?: number): string {
  return [overall ? `OVR ${overall}` : null, level ? `Lvl ${level}` : null, build]
    .filter(Boolean)
    .join(' | ');
}
