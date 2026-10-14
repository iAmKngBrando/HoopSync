// Shapes returned by apps/server (the ported 2kOT API) and the view-models
// built from them. Forklifted from 2kot-app/src/types/{index,dashboard}.ts.

export interface Opponent {
  id: number;
  name: string;
  gamertag?: string | null;
  overall?: number | null;
  level?: number | null;
  build?: string | null;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  last_played: string | null;
  created_at: string;
}

export const STAT_COLUMNS = [
  'GRD',
  'MIN',
  'PTS',
  'REB',
  'AST',
  'STL',
  'BLK',
  'FOULS',
  'TO',
  'FGM/FGA',
  '3PM/3PA',
  'FTM/FTA',
] as const;

export type StatColumn = (typeof STAT_COLUMNS)[number];
export type StatRow = Partial<Record<StatColumn, number | string>>;

/** Box-score lines for a game, as read from the stats screen or a photo. */
export interface GameStats {
  you?: StatRow;
  opponent?: StatRow;
}

export interface Game {
  id: number;
  opponent_id: number;
  your_score: number;
  opponent_score: number;
  outcome: 'win' | 'loss';
  game_type: string;
  date: string;
  source?: 'manual' | 'capture';
  stats?: GameStats | null;
  stats_photo_path?: string | null;
  start_frame_path?: string | null;
  end_frame_path?: string | null;
}

export interface Statistics {
  total_games: number;
  total_wins: number;
  total_losses: number;
  overall_win_rate: number;
  current_streak: number;
  most_frequent_opponents: Opponent[];
}

export type GameResult = 'win' | 'loss';
export type GameStatus = 'live' | 'ended' | 'upcoming';
export type CaptureState = 'connected' | 'recording' | 'processing' | 'idle' | 'disconnected';

export interface PlayerIdentity {
  name: string;
  gamertag?: string;
  overall?: number;
  level?: number;
  build?: string;
  vitals?: string;
  avatarUrl?: string;
}

export interface CapturedFrame {
  imageUrl?: string;
  capturedAt?: string;
  label: string;
}

export interface CurrentGame {
  status: GameStatus;
  opponent: PlayerIdentity;
  yourLabel?: string;
  quarter?: number;
  clock?: string;
  yourScore?: number;
  opponentScore?: number;
  frame?: CapturedFrame;
}

export interface OpponentSummary extends PlayerIdentity {
  id: number;
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
  lastPlayed?: string | null;
  lastResult?: GameResult;
  /** Positive = consecutive wins vs this opponent, negative = losses */
  streak?: number;
}

export interface MatchupCapture {
  opponent: PlayerIdentity;
  frame: CapturedFrame;
}

export interface EndGameResult {
  outcome: GameResult;
  yourScore: number;
  opponentScore: number;
  frame: CapturedFrame;
}

export interface GameHistoryRow {
  id: number;
  date: string;
  opponent: string;
  result: GameResult;
  yourScore: number;
  opponentScore: number;
  mode: string;
  recordWins: number;
  recordLosses: number;
}

export interface OverallStats {
  totalGames: number;
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
  streak: number;
}

export interface DashboardData {
  /** True when the values below are sample data rather than tracked games */
  isSample: boolean;
  currentGame: CurrentGame | null;
  focusOpponent: OpponentSummary | null;
  liveMatchup: MatchupCapture | null;
  endGame: EndGameResult | null;
  history: GameHistoryRow[];
  stats: OverallStats;
  recentOpponents: OpponentSummary[];
  nextMatchup: MatchupCapture | null;
}

/** Live state reported by the server's session tracker (GET /api/live). */
export interface LiveState {
  capture_state: CaptureState;
  last_frame_at: string | null;
  session: {
    phase: 'idle' | 'pregame' | 'in_progress' | 'ended';
    opponent_name: string | null;
    opponent_overall: number | null;
    opponent_build: string | null;
    opponent_level: number | null;
    your_name: string | null;
    your_score: number | null;
    opponent_score: number | null;
    mode: string | null;
    quarter: number | null;
    clock: string | null;
    start_frame_url: string | null;
  };
}
