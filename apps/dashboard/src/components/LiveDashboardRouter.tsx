import { useState } from 'react';
import { cn } from '../utils/cn';
import { DashboardView } from './DashboardView';
import { LiveSessionView } from '../features/live-session/LiveSessionView';

type LiveMode = 'opponent' | 'squad';

/**
 * The Live Dashboard is state-driven: apps/server can only ever report a
 * single you-vs-opponent session today (2kOT's existing scope), so that's
 * the default, real-data view. The squad box score (2v2/3v3/5v5) built
 * earlier has no real data source yet — no detector reports teammates — so
 * it stays reachable as an explicit, clearly-labeled sample preview rather
 * than silently showing fake numbers as if they were live. Once squad
 * detection lands (see the product brief's §34b to-dos) this becomes a real
 * phase branch instead of a manual toggle.
 */
export function LiveDashboardRouter() {
  const [mode, setMode] = useState<LiveMode>('opponent');

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-5 pt-5">
        <div className="inline-flex rounded-full border border-border-soft bg-inset p-1">
          <button
            type="button"
            onClick={() => setMode('opponent')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'opponent' ? 'bg-primary text-background' : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            Opponent Tracking
          </button>
          <button
            type="button"
            onClick={() => setMode('squad')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'squad' ? 'bg-primary text-background' : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            Squad Preview
          </button>
        </div>
        {mode === 'squad' && (
          <span className="text-xs text-muted-foreground">
            Sample only — 2v2/3v3/5v5 detection isn't built yet.
          </span>
        )}
      </div>

      {mode === 'opponent' ? <LiveSessionView /> : <DashboardView />}
    </div>
  );
}
