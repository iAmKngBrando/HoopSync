import { useState } from 'react';
import { DeviceCapturePanel } from './DeviceCapturePanel';
import { FriendsSettingsPanel } from '../friends/FriendsSettingsPanel';
import { DevBoardPanel } from '../dev-board/DevBoardPanel';

type SettingsTab = 'general' | 'developer';

const tabs: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'developer', label: 'Developer' },
];

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('general');

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex gap-1 rounded-lg bg-inset/50 p-1 self-start">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary text-background' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <>
          <DeviceCapturePanel />
          <FriendsSettingsPanel />
        </>
      ) : (
        <DevBoardPanel />
      )}
    </div>
  );
}
