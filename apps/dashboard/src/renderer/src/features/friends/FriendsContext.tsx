// Owns the FriendsClient's connect/disconnect lifecycle and the persisted
// config (host/port/session/display name) - a thin wrapper so the Settings
// panel can change config and have the client reconnect automatically.
// Live data itself (remote players, status) is read via useFriendsClient's
// hooks directly from the module-level `friendsClient` singleton, not
// through this context.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { friendsClient } from './FriendsClient';
import { loadFriendsConfig, saveFriendsConfig, type FriendsConfig } from './friendsConfig';

interface FriendsContextValue {
  config: FriendsConfig;
  setConfig: (config: FriendsConfig) => void;
}

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<FriendsConfig>(() => loadFriendsConfig());

  useEffect(() => {
    if (!config.enabled) return;
    friendsClient.connect(config);
    return () => friendsClient.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled, config.host, config.port, config.sessionId, config.playerName]);

  const setConfig = (next: FriendsConfig) => {
    saveFriendsConfig(next);
    setConfigState(next);
  };

  return <FriendsContext.Provider value={{ config, setConfig }}>{children}</FriendsContext.Provider>;
}

export function useFriendsConfig(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriendsConfig must be used within a FriendsProvider');
  return ctx;
}
