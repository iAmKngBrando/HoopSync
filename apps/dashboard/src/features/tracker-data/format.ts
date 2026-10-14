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

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return 'No frames yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Just now';
  const seconds = Math.round(ms / 1000);
  if (seconds < 2) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
