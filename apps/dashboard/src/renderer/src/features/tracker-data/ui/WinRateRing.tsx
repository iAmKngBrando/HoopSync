import { useId } from 'react';
import { formatPercent } from '../format';

interface WinRateRingProps {
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
  caption?: string;
  size?: number;
}

export function WinRateRing({ wins, losses, winRate, caption = 'W/L vs You', size = 124 }: WinRateRingProps) {
  const gradientId = useId();
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, winRate));

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${wins} wins, ${losses} losses, ${formatPercent(clamped)} win rate`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--success)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-foreground-secondary">{caption}</span>
        <span className="text-2xl font-bold tabular-nums leading-tight text-foreground">
          {wins} - {losses}
        </span>
        <span className="text-xs font-semibold tabular-nums text-success">{formatPercent(clamped)}</span>
      </div>
    </div>
  );
}
