import { useState } from 'react';
import { useFriendsConfig } from './FriendsContext';
import { useFriendsRemotePlayers, useFriendsStatus } from './useFriendsClient';
import { Card, SectionHeader } from '../../components/ui/Card';
import { StatusIndicator } from '../../components/ui/StatusIndicator';

const inputClass =
  'w-full rounded-lg border border-border-muted bg-inset px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-xs font-medium text-foreground-secondary';

export function FriendsSettingsPanel() {
  const { config, setConfig } = useFriendsConfig();
  const [draft, setDraft] = useState(config);
  const status = useFriendsStatus();
  const remotePlayers = useFriendsRemotePlayers();

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const statusState = status === 'connected' ? 'connected' : status === 'reconnecting' || status === 'connecting' ? 'live' : 'disconnected';
  const statusLabel = { disconnected: 'Off', connecting: 'Connecting…', connected: 'Connected', reconnecting: 'Reconnecting…' }[status];

  return (
    <Card label="Friends">
      <SectionHeader
        title="FRIENDS"
        action={<StatusIndicator state={statusState} label={config.enabled ? statusLabel : 'Off'} />}
      />
      <p className="mb-4 text-xs text-foreground-secondary">
        Relays live stats with friends also running HoopSync, in the same session, so everyone sees
        each other on the dashboard (the player cards up top, Connected Friends). Local by default
        for development — point it at a shared relay (your AWS box, or a friend's LAN IP) to actually
        play together.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="friends-enabled" className="text-sm font-medium text-foreground">
            Enable Friends
          </label>
          <button
            id="friends-enabled"
            type="button"
            role="switch"
            aria-checked={draft.enabled}
            onClick={() => setDraft((d) => ({ ...d, enabled: !d.enabled }))}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${draft.enabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <span
              className={`inline-block size-3.5 transform rounded-full bg-white shadow transition-transform ${draft.enabled ? 'translate-x-[18px]' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div>
          <label htmlFor="friends-name" className={labelClass}>
            Display name
          </label>
          <input
            id="friends-name"
            type="text"
            value={draft.playerName}
            onChange={(e) => setDraft((d) => ({ ...d, playerName: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="friends-session" className={labelClass}>
            Session name
          </label>
          <input
            id="friends-session"
            type="text"
            value={draft.sessionId}
            onChange={(e) => setDraft((d) => ({ ...d, sessionId: e.target.value }))}
            placeholder="e.g. hoopsync, or your crew's run name"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="friends-host" className={labelClass}>
              Relay host
            </label>
            <input
              id="friends-host"
              type="text"
              value={draft.host}
              onChange={(e) => setDraft((d) => ({ ...d, host: e.target.value }))}
              placeholder="127.0.0.1, a LAN IP, or your AWS relay's address"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="friends-port" className={labelClass}>
              Port
            </label>
            <input
              id="friends-port"
              type="number"
              value={draft.port}
              onChange={(e) => setDraft((d) => ({ ...d, port: Number(e.target.value) || d.port }))}
              className={`${inputClass} w-24`}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setConfig(draft)}
            disabled={!dirty}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            Save
          </button>
        </div>

        {config.enabled && (
          <div className="border-t border-border-soft pt-3 text-xs text-foreground-secondary">
            {remotePlayers.size === 0
              ? 'No one else in this session yet.'
              : `${remotePlayers.size} other ${remotePlayers.size === 1 ? 'friend' : 'friends'} in this session: ${[...remotePlayers.values()].map((p) => p.playerName).join(', ')}`}
          </div>
        )}
      </div>
    </Card>
  );
}
