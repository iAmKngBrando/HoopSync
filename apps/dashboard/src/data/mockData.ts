import type {
  BoxScoreRow,
  ConnectedFriend,
  GameSummaryStat,
  PlayByPlayEvent,
  PlayerSummary,
  SessionHistoryEntry,
  TopPerformer,
} from '../types';

export const topPlayerCards: PlayerSummary[] = [
  { id: 'p1', name: 'Brando', position: 'P1', avatarColor: '#8b5cf6', isMvp: true, isSelf: true, live: true, pts: 24, reb: 8, ast: 6 },
  { id: 'p2', name: 'JaySmooth', position: 'P2', avatarColor: '#3b82f6', live: true, pts: 18, reb: 3, ast: 7 },
  { id: 'p3', name: 'Swish_33', position: 'P3', avatarColor: '#a855f7', live: true, pts: 12, reb: 5, ast: 4 },
  { id: 'p4', name: 'AirBuckets', position: 'P4', avatarColor: '#f97316', live: true, pts: 9, reb: 6, ast: 2 },
];

export const minimalRosterCards: PlayerSummary[] = [
  ...topPlayerCards,
  { id: 'o1', name: 'IsoKing', position: 'OPP', avatarColor: '#64748b', live: true, pts: 17, reb: 2, ast: 3 },
  { id: 'o2', name: 'Hooper24', position: 'OPP', avatarColor: '#64748b', live: true, pts: 14, reb: 6, ast: 5 },
  { id: 'o3', name: 'GreenMachine', position: 'OPP', avatarColor: '#64748b', live: true, pts: 11, reb: 4, ast: 2 },
  { id: 'o4', name: 'PostUpLegend', position: 'OPP', avatarColor: '#64748b', live: true, pts: 6, reb: 5, ast: 1 },
];

export const myTeamBoxScore: BoxScoreRow[] = [
  { id: 'p1', name: 'Brando', pts: 24, reb: 8, ast: 6, stl: 1, blk: 0, fgMade: 9, fgAtt: 12, tpMade: 6, tpAtt: 7, to: 1, plusMinus: 15, highlight: true },
  { id: 'p2', name: 'JaySmooth', pts: 18, reb: 3, ast: 7, stl: 0, blk: 0, fgMade: 7, fgAtt: 11, tpMade: 4, tpAtt: 6, to: 0, plusMinus: 11 },
  { id: 'p3', name: 'Swish_33', pts: 12, reb: 5, ast: 4, stl: 1, blk: 1, fgMade: 5, fgAtt: 8, tpMade: 2, tpAtt: 4, to: 1, plusMinus: 7 },
  { id: 'p4', name: 'AirBuckets', pts: 9, reb: 6, ast: 2, stl: 1, blk: 1, fgMade: 4, fgAtt: 7, tpMade: 1, tpAtt: 2, to: 0, plusMinus: 6 },
  { id: 'p5', name: 'AI Player', pts: 0, reb: 4, ast: 1, stl: 0, blk: 0, fgMade: 0, fgAtt: 0, tpMade: 0, tpAtt: 0, to: 0, plusMinus: 0 },
];

export const opponentBoxScore: BoxScoreRow[] = [
  { id: 'o1', name: 'IsoKing', pts: 17, reb: 2, ast: 3, stl: 0, blk: 0, fgMade: 7, fgAtt: 10, tpMade: 3, tpAtt: 5, to: 1, plusMinus: -9 },
  { id: 'o2', name: 'Hooper24', pts: 14, reb: 6, ast: 5, stl: 1, blk: 1, fgMade: 6, fgAtt: 9, tpMade: 2, tpAtt: 3, to: 0, plusMinus: -7 },
  { id: 'o3', name: 'GreenMachine', pts: 11, reb: 4, ast: 2, stl: 0, blk: 0, fgMade: 5, fgAtt: 8, tpMade: 1, tpAtt: 2, to: 1, plusMinus: -8 },
  { id: 'o4', name: 'PostUpLegend', pts: 6, reb: 5, ast: 1, stl: 1, blk: 0, fgMade: 3, fgAtt: 6, tpMade: 0, tpAtt: 0, to: 1, plusMinus: -6 },
  { id: 'o5', name: 'AI Player', pts: 0, reb: 2, ast: 0, stl: 0, blk: 0, fgMade: 0, fgAtt: 0, tpMade: 0, tpAtt: 0, to: 0, plusMinus: 0 },
];

export const playByPlay: PlayByPlayEvent[] = [
  { id: 'e1', time: '00:32', team: 'my', player: 'Brando', description: '3PT Made (24 PTS)' },
  { id: 'e2', time: '00:28', team: 'my', player: 'JaySmooth', description: 'Assist to Brando' },
  { id: 'e3', time: '00:15', team: 'my', player: 'Swish_33', description: 'Steal' },
  { id: 'e4', time: '00:12', team: 'opponent', player: 'AirBuckets', description: 'Layup Made (9 PTS)' },
  { id: 'e5', time: '00:05', team: 'my', player: 'Brando', description: 'Defensive Rebound' },
];

export const topPerformers: TopPerformer[] = [
  { id: 'tp1', rank: 1, name: 'Brando', isMvp: true, pts: 24, reb: 8, ast: 6 },
  { id: 'tp2', rank: 2, name: 'JaySmooth', pts: 18, reb: 3, ast: 7 },
  { id: 'tp3', rank: 3, name: 'Swish_33', pts: 12, reb: 5, ast: 4 },
];

export const gameSummary: GameSummaryStat[] = [
  { label: 'FG%', my: 65, opponent: 58, suffix: '%' },
  { label: '3PT%', my: 68, opponent: 40, suffix: '%' },
  { label: 'PTS IN PAINT', my: 26, opponent: 18 },
  { label: 'TURNOVERS', my: 6, opponent: 9 },
];

export const sessionHistory: SessionHistoryEntry[] = [
  { id: 's1', date: 'May 18, 2025', match: 'MyPark Run – 5v5', players: ['Brando', 'JaySmooth', 'Swish_33', 'AirBuckets'], result: 'Win', score: '63 – 48', duration: '32:18' },
  { id: 's2', date: 'May 18, 2025', match: 'Rec Center – 3v3', players: ['Brando', 'JaySmooth', 'Swish_33'], result: 'Win', score: '21 – 18', duration: '18:45' },
  { id: 's3', date: 'May 17, 2025', match: 'Pro-Am – 5v5', players: ['Brando', 'JaySmooth', 'Swish_33', 'AirBuckets'], result: 'Loss', score: '55 – 62', duration: '41:02' },
];

export const connectedFriends: ConnectedFriend[] = [
  { id: 'f1', name: 'JaySmooth', status: 'In MyPark' },
  { id: 'f2', name: 'Swish_33', status: 'In MyPark' },
  { id: 'f3', name: 'AirBuckets', status: 'In MyPark' },
  { id: 'f4', name: 'Brando', status: 'Streaming', streaming: true },
];

export const myTeamTotals = {
  pts: 63,
  reb: 26,
  ast: 20,
  stl: 3,
  blk: 2,
  fgMade: 25,
  fgAtt: 38,
  tpMade: 13,
  tpAtt: 19,
  to: 2,
  plusMinus: 15,
};

export const opponentTotals = {
  pts: 48,
  reb: 19,
  ast: 11,
  stl: 2,
  blk: 1,
  fgMade: 21,
  fgAtt: 33,
  tpMade: 6,
  tpAtt: 10,
  to: 3,
  plusMinus: -15,
};
