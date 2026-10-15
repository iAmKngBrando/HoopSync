import { DeviceCapturePanel } from './DeviceCapturePanel';
import { FriendsSettingsPanel } from '../friends/FriendsSettingsPanel';

export function SettingsView() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <DeviceCapturePanel />
      <FriendsSettingsPanel />
    </div>
  );
}
