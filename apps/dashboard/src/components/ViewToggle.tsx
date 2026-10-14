import { cn } from '../utils/cn';
import type { ViewMode } from '../types';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const isMinimal = mode === 'minimal';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isMinimal}
      onClick={() => onChange(isMinimal ? 'full' : 'minimal')}
      className="flex items-center gap-2 rounded-full border border-border-soft bg-inset py-1 pl-2.5 pr-1 transition-colors hover:border-border"
      title="Toggle minimal dashboard"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Minimal</span>
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          isMinimal ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 transform rounded-full bg-white shadow transition-transform',
            isMinimal ? 'translate-x-[18px]' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  );
}
