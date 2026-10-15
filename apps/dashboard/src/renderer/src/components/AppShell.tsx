import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { NavKey, ViewMode } from '../types';

interface AppShellProps {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: ReactNode;
}

export function AppShell({ active, onSelect, viewMode, onViewModeChange, children }: AppShellProps) {
  return (
    <div className="app-bg flex h-screen overflow-hidden">
      <Sidebar active={active} onSelect={onSelect} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
