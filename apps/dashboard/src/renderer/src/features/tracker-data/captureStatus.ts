import type { ConnectionState } from '../../components/ui/StatusIndicator';
import type { CaptureState } from './types';
import type { Connection } from './useTrackerData';

/** Maps the server's reported capture/connection state to a status pill - shared by
 * the sidebar and MinimalDashboard, which both need to show it. */
export function captureStatus(
  connection: Connection,
  captureState: CaptureState,
): { state: ConnectionState; label: string } {
  if (connection === 'loading') return { state: 'disconnected', label: 'Checking…' };
  if (connection === 'offline') return { state: 'disconnected', label: 'Server offline' };
  if (captureState === 'recording' || captureState === 'processing') {
    return { state: 'live', label: 'Live' };
  }
  if (captureState === 'connected') return { state: 'connected', label: 'Connected' };
  return { state: 'disconnected', label: 'No capture' };
}
