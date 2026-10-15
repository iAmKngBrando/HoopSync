// Client for apps/server (the ported 2kOT API). Uses an absolute URL rather
// than relying on a dev-only proxy, matching apps/capture's liveTracking.ts -
// this app runs as Electron now (see src/main/index.ts), where there's no
// dev-server proxy to lean on once this is ever packaged. Forklifted from
// 2kot-app/src/api/client.ts.

import type { Game, GameStats, LiveState, Opponent, Statistics } from './types';

export const SERVER_URL = 'http://127.0.0.1:8787';

/** Prefixes a server-relative path (e.g. "/api/frames/3/image") with the server
 * origin, so <img src> etc. resolve correctly without a dev proxy in the way. */
export function toServerUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${SERVER_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}/api${path}`, {
      ...init,
      // FormData sets its own multipart content type.
      headers: typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('The tracker service is not reachable', 0);
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new ApiError('The tracker service is not reachable', 0);
    }
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? String(detail[0].msg).replace(/^Value error, /, '')
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export interface NewOpponent {
  name: string;
  gamertag?: string;
  overall?: number;
  build?: string;
}

export interface NewGameResult {
  opponent_id?: number;
  opponent_name?: string;
  your_score: number;
  opponent_score: number;
  game_type: string;
}

export interface StatsPhotoResult {
  /** What was read from the photo; not saved until confirmed */
  stats: GameStats;
  photo_url: string;
  warnings: string[];
}

export const api = {
  listOpponents: () => request<Opponent[]>('/opponents'),
  createOpponent: (body: NewOpponent) =>
    request<Opponent>('/opponents', { method: 'POST', body: JSON.stringify(body) }),
  deleteOpponent: (id: number) => request<void>(`/opponents/${id}`, { method: 'DELETE' }),
  listGames: () => request<Game[]>('/games'),
  logGame: (body: NewGameResult) =>
    request<Game>('/game_result', { method: 'POST', body: JSON.stringify(body) }),
  updateGame: (id: number, body: { stats?: GameStats | null; game_type?: string }) =>
    request<Game>(`/games/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  readStatsPhoto: (id: number, photo: File) => {
    const body = new FormData();
    body.append('file', photo);
    return request<StatsPhotoResult>(`/games/${id}/stats_photo`, { method: 'POST', body });
  },
  deleteGame: (id: number) => request<void>(`/games/${id}`, { method: 'DELETE' }),
  getStatistics: () => request<Statistics>('/stats'),
  getLive: () => request<LiveState>('/live'),
};
