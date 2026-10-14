import { Bell, ChevronDown, Users } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { ViewToggle } from './ViewToggle';
import type { ViewMode } from '../types';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TopBar({ viewMode, onViewModeChange }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-soft px-5">
      <div className="flex items-center gap-4">
        <span className="brand-mark text-xl">
          <span className="text-primary">Hoop</span>
          <span className="text-foreground">Sync</span>
        </span>

        <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success">
          <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
          LIVE SESSION
        </span>

        <span className="text-sm font-medium text-foreground-secondary">MyPark Run – 5v5</span>

        <span className="flex items-center gap-2 font-display text-sm font-semibold tabular-nums text-foreground">
          00:32:18
          <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />

        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full border border-border-soft bg-inset text-foreground-secondary transition-colors hover:text-foreground"
        >
          <Bell size={16} />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <span className="flex items-center gap-1.5 rounded-full border border-border-soft bg-inset px-3 py-1.5 text-xs font-semibold text-foreground-secondary">
          <Users size={14} />
          4
        </span>

        <button type="button" className="flex items-center gap-2 rounded-full border border-border-soft bg-inset py-1 pl-1 pr-2.5 hover:border-border">
          <Avatar name="Brando" color="#8b5cf6" size={28} />
          <span className="text-sm font-semibold text-foreground">Brando</span>
          <ChevronDown size={14} className="text-foreground-secondary" />
        </button>
      </div>
    </header>
  );
}
