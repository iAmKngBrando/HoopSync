export type ViewMode = 'full' | 'minimal';

export type NavKey =
  | 'live'
  | 'games'
  | 'players'
  | 'leaderboards'
  | 'teamStats'
  | 'clips'
  | 'otAnalytics'
  | 'settings';

export interface PlayerSummary {
  id: string;
  name: string;
  position: string;
  avatarColor: string;
  isMvp?: boolean;
  isSelf?: boolean;
  live: boolean;
  pts: number;
  reb: number;
  ast: number;
}

export interface BoxScoreRow {
  id: string;
  name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgMade: number;
  fgAtt: number;
  tpMade: number;
  tpAtt: number;
  to: number;
  plusMinus: number;
  highlight?: boolean;
}

export interface PlayByPlayEvent {
  id: string;
  time: string;
  team: 'my' | 'opponent' | 'neutral';
  player: string;
  description: string;
}

export interface TopPerformer {
  id: string;
  rank: number;
  name: string;
  isMvp?: boolean;
  pts: number;
  reb: number;
  ast: number;
}

export interface SessionHistoryEntry {
  id: string;
  date: string;
  match: string;
  players: string[];
  result: 'Win' | 'Loss';
  score: string;
  duration: string;
}

export interface ConnectedFriend {
  id: string;
  name: string;
  status: string;
  streaming?: boolean;
}

export interface GameSummaryStat {
  label: string;
  my: number;
  opponent: number;
  suffix?: string;
}
