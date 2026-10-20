import { useState } from 'react';
import { LayoutGrid, Trophy, Video } from 'lucide-react';
import { AppShell } from './components/AppShell';
import { LiveDashboardRouter } from './components/LiveDashboardRouter';
import { MinimalDashboard } from './components/MinimalDashboard';
import { PlaceholderView } from './components/PlaceholderView';
import { OtAnalyticsView } from './features/ot-analytics/OtAnalyticsView';
import { SettingsView } from './features/capture/SettingsView';
import { TrackerDataProvider } from './features/tracker-data/TrackerDataContext';
import { FriendsProvider } from './features/friends/FriendsContext';
import { LocalPlayerReporter } from './features/friends/LocalPlayerReporter';
import { DeviceCaptureProvider } from './features/capture/DeviceCaptureContext';
import type { NavKey, ViewMode } from './types';

const placeholders: Partial<Record<NavKey, { icon: typeof Trophy; title: string; description: string }>> = {
  leaderboards: { icon: Trophy, title: 'Leaderboards', description: 'Season leaderboards are coming soon.' },
  teamStats: { icon: LayoutGrid, title: 'Team Stats', description: 'Aggregated team stats are coming soon.' },
  clips: { icon: Video, title: 'Clips', description: 'Your saved clip library is coming soon.' },
};

function App() {
  const [active, setActive] = useState<NavKey>('live');
  const [viewMode, setViewMode] = useState<ViewMode>('full');

  if (viewMode === 'minimal') {
    return <MinimalDashboard onViewModeChange={setViewMode} />;
  }

  const placeholder = placeholders[active];

  return (
    <TrackerDataProvider>
      <FriendsProvider>
        <DeviceCaptureProvider>
          <LocalPlayerReporter />
          <AppShell active={active} onSelect={setActive} viewMode={viewMode} onViewModeChange={setViewMode}>
            {active === 'live' ? (
              <LiveDashboardRouter />
            ) : active === 'otAnalytics' ? (
              <OtAnalyticsView />
            ) : active === 'settings' ? (
              <SettingsView />
            ) : placeholder ? (
              <PlaceholderView icon={placeholder.icon} title={placeholder.title} description={placeholder.description} />
            ) : null}
          </AppShell>
        </DeviceCaptureProvider>
      </FriendsProvider>
    </TrackerDataProvider>
  );
}

export default App;
