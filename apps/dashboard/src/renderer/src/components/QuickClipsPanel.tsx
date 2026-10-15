import { Play } from 'lucide-react';
import { Card, SectionHeader } from './ui/Card';

export function QuickClipsPanel() {
  return (
    <Card>
      <SectionHeader title="QUICK CLIPS" />
      <div className="flex items-center gap-3">
        <div className="relative flex aspect-video w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/25 via-background-secondary to-accent-blue/20">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-transform hover:scale-105"
          >
            <Play size={14} fill="currentColor" />
          </button>
          <span className="absolute bottom-1 right-1.5 text-[10px] font-semibold tabular-nums text-white/80">00:32</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">Brando</div>
          <div className="truncate text-xs text-foreground-secondary">3PT Made</div>
          <div className="text-xs text-muted-foreground">00:32 · 4th QTR</div>
        </div>
      </div>
    </Card>
  );
}
