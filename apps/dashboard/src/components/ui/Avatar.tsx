import { Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  isMvp?: boolean;
  ring?: boolean;
}

export function Avatar({ name, color, size = 44, isMvp, ring }: AvatarProps) {
  const initials = name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn('flex h-full w-full items-center justify-center rounded-full font-bold text-background', ring && 'ring-2 ring-primary ring-offset-2 ring-offset-card')}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          fontSize: size * 0.36,
        }}
      >
        {initials}
      </div>
      {isMvp && (
        <Crown
          className="absolute -right-1 -top-1.5 rounded-full bg-background p-0.5 text-warning"
          size={size * 0.42}
          fill="currentColor"
        />
      )}
    </div>
  );
}
