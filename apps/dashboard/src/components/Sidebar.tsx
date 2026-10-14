import {
  Activity,
  Gamepad2,
  LayoutGrid,
  LineChart,
  Settings,
  Trophy,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { NavKey } from '../types';
import { StatusIndicator, type ConnectionState } from './ui/StatusIndicator';
import { useTrackerDataContext } from '../features/tracker-data/TrackerDataContext';
import { formatRelativeTime } from '../features/tracker-data/format';

interface NavItem {
  key: NavKey;
  label: string;
  icon: typeof Activity;
}

const navItems: NavItem[] = [
  { key: 'live', label: 'Live Dashboard', icon: Activity },
  { key: 'games', label: 'Games', icon: Gamepad2 },
  { key: 'players', label: 'Players', icon: Users },
  { key: 'leaderboards', label: 'Leaderboards', icon: Trophy },
  { key: 'teamStats', label: 'Team Stats', icon: LayoutGrid },
  { key: 'clips', label: 'Clips', icon: Video },
  { key: 'otAnalytics', label: 'OT Analytics', icon: LineChart },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  active: NavKey;
  onSelect: (key: NavKey) => void;
}

/** Maps the server's reported capture/connection state to a status pill. */
function captureStatus(
  connection: 'loading' | 'online' | 'offline',
  captureState: 'connected' | 'recording' | 'processing' | 'idle' | 'disconnected',
): { state: ConnectionState; label: string } {
  if (connection === 'loading') return { state: 'disconnected', label: 'Checking…' };
  if (connection === 'offline') return { state: 'disconnected', label: 'Server offline' };
  if (captureState === 'recording' || captureState === 'processing') {
    return { state: 'live', label: 'Live' };
  }
  if (captureState === 'connected') return { state: 'connected', label: 'Connected' };
  return { state: 'disconnected', label: 'No capture' };
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  const { connection, captureState, live } = useTrackerDataContext();
  const status = captureStatus(connection, captureState);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col justify-between border-r border-border-soft bg-sidebar px-3 py-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold tracking-wide transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-primary/25 to-primary/5 text-foreground shadow-[inset_2px_0_0_var(--primary)]'
                  : 'text-foreground-secondary hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={17} className={cn(isActive ? 'text-primary' : 'text-foreground-secondary')} />
              <span className="uppercase">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="panel-inset p-3">
        <div className="eyebrow mb-2">Capture</div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-foreground">Elgato HD60 X</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(live?.last_frame_at)}</div>
        <div className="mt-3 border-t border-border-soft pt-2">
          <StatusIndicator state={status.state} label={status.label} />
        </div>
      </div>
    </aside>
  );
}
