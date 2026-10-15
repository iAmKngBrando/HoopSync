// Single shared poller for apps/server's opponents/games/stats/live data.
// Everything that needs it (Sidebar's connection status, OT Analytics, the
// Live Dashboard's opponent view) reads from one TrackerDataProvider at the
// app root instead of each polling independently.

import { createContext, useContext, type ReactNode } from 'react';
import { useTrackerData, type TrackerData } from './useTrackerData';

const TrackerDataContext = createContext<TrackerData | null>(null);

export function TrackerDataProvider({ children }: { children: ReactNode }) {
  const data = useTrackerData();
  return <TrackerDataContext.Provider value={data}>{children}</TrackerDataContext.Provider>;
}

export function useTrackerDataContext(): TrackerData {
  const ctx = useContext(TrackerDataContext);
  if (!ctx) throw new Error('useTrackerDataContext must be used within a TrackerDataProvider');
  return ctx;
}
