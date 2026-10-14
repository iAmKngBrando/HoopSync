import { cn } from '../../../utils/cn';

const tints = [
  'from-primary/35 to-accent-blue/25 text-primary',
  'from-accent-blue/40 to-accent-blue/25 text-accent-blue-hover',
  'from-accent-blue/35 to-primary/25 text-accent-blue-hover',
  'from-success/30 to-primary/25 text-success',
];

function tintFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % tints.length;
  return tints[hash];
}

const sizes = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
};

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}

/** Opponent avatar; falls back to a tinted initial until real images exist. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-soft bg-gradient-to-br font-semibold',
        sizes[size],
        tintFor(name),
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase() || '?'
      )}
    </span>
  );
}
