// SAMPLE DATA ONLY. Shown on OT Analytics / the Live Dashboard idle view
// (with a visible "Sample data" badge) while apps/server has no opponents or
// games yet. None of this comes from capture, OCR or the database. Forklifted
// from 2kot-app/src/data/mockData.ts.

import type { DashboardData, OpponentSummary } from './types';

const sampleOpponents: OpponentSummary[] = [
  {
    id: -1,
    name: 'ItsMeJayy',
    overall: 93,
    build: '2-Way 3-Level Scorer',
    vitals: 'SF | 6\'7" | 215 lbs',
    wins: 6,
    losses: 4,
    winRate: 60,
    lastPlayed: '2026-10-08',
    lastResult: 'win',
    streak: 2,
  },
  {
    id: -2,
    name: 'Trillez',
    overall: 91,
    build: 'Inside-Out Shot Creator',
    wins: 3,
    losses: 5,
    winRate: 38,
    lastPlayed: '2026-10-06',
    lastResult: 'loss',
    streak: -1,
  },
  {
    id: -3,
    name: 'iTzCam',
    overall: 90,
    build: 'Glass-Cleaning Lockdown',
    wins: 4,
    losses: 3,
    winRate: 57,
    lastPlayed: '2026-10-03',
    lastResult: 'win',
    streak: 1,
  },
  {
    id: -4,
    name: 'KingDre',
    overall: 92,
    build: 'Point Forward',
    vitals: 'PF | 6\'8" | 220 lbs',
    wins: 2,
    losses: 1,
    winRate: 67,
    lastPlayed: '2026-09-30',
    lastResult: 'win',
    streak: 2,
  },
  {
    id: -5,
    name: 'SheLuvsBuckets',
    overall: 89,
    build: 'Sharpshooting Playmaker',
    wins: 1,
    losses: 2,
    winRate: 33,
    lastPlayed: '2026-09-28',
    lastResult: 'loss',
    streak: -1,
  },
];

const [jayy, trillez, cam, dre, buckets] = sampleOpponents as [
  OpponentSummary,
  OpponentSummary,
  OpponentSummary,
  OpponentSummary,
  OpponentSummary,
];

export const sampleDashboardData: DashboardData = {
  isSample: true,
  currentGame: {
    status: 'live',
    opponent: jayy,
    yourLabel: 'You',
    quarter: 2,
    clock: '03:42',
  },
  focusOpponent: jayy,
  liveMatchup: {
    opponent: jayy,
    frame: { capturedAt: '00:00', label: 'Matchup Screen' },
  },
  endGame: {
    outcome: 'win',
    yourScore: 21,
    opponentScore: 14,
    frame: { capturedAt: '00:00', label: 'End Game Screen' },
  },
  history: [
    { id: -1, date: '2026-10-08', opponent: jayy.name, result: 'win', yourScore: 21, opponentScore: 14, mode: 'Rec', recordWins: 6, recordLosses: 4 },
    { id: -2, date: '2026-10-06', opponent: trillez.name, result: 'loss', yourScore: 17, opponentScore: 21, mode: 'Rec', recordWins: 3, recordLosses: 5 },
    { id: -3, date: '2026-10-03', opponent: cam.name, result: 'win', yourScore: 24, opponentScore: 18, mode: 'Rec', recordWins: 4, recordLosses: 3 },
    { id: -4, date: '2026-09-30', opponent: dre.name, result: 'win', yourScore: 16, opponentScore: 12, mode: 'Rec', recordWins: 2, recordLosses: 1 },
    { id: -5, date: '2026-09-28', opponent: buckets.name, result: 'loss', yourScore: 15, opponentScore: 19, mode: 'Rec', recordWins: 1, recordLosses: 2 },
  ],
  stats: { totalGames: 12, wins: 7, losses: 5, winRate: 58, streak: 2 },
  recentOpponents: sampleOpponents,
  nextMatchup: {
    opponent: dre,
    frame: { capturedAt: '00:00', label: 'Matchup Screen' },
  },
};
