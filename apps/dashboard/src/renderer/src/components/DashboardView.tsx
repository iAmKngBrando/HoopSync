import {
  connectedFriends,
  gameSummary,
  myTeamBoxScore,
  myTeamTotals,
  opponentBoxScore,
  opponentTotals,
  playByPlay,
  sessionHistory,
  topPerformers,
  topPlayerCards,
} from '../data/mockData';
import { PlayerStatCards } from './PlayerStatCards';
import { LiveScoreboard } from './LiveScoreboard';
import { BoxScoreTable } from './BoxScoreTable';
import { PlayByPlayPanel } from './PlayByPlayPanel';
import { TopPerformersPanel } from './TopPerformersPanel';
import { GameSummaryPanel } from './GameSummaryPanel';
import { SessionHistoryPanel } from './SessionHistoryPanel';
import { QuickClipsPanel } from './QuickClipsPanel';
import { ConnectedFriendsPanel } from './ConnectedFriendsPanel';
import { Card, SectionHeader } from './ui/Card';

export function DashboardView() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <PlayerStatCards players={topPlayerCards} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionHeader title="LIVE SCOREBOARD" live />
            <LiveScoreboard
              myScore={63}
              opponentScore={48}
              quarter="4TH QUARTER"
              clock="1:24"
              shotClock={24}
              myFouls={2}
              myTimeouts={1}
              opponentFouls={3}
              opponentTimeouts={1}
              possession="opponent"
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BoxScoreTable title="MY TEAM" accent="primary" rows={myTeamBoxScore} totals={myTeamTotals} />
            <BoxScoreTable title="OPPONENT" accent="blue" rows={opponentBoxScore} totals={opponentTotals} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PlayByPlayPanel events={playByPlay} />
          <TopPerformersPanel performers={topPerformers} />
          <GameSummaryPanel myScore={63} opponentScore={48} stats={gameSummary} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px_280px]">
        <SessionHistoryPanel sessions={sessionHistory} />
        <QuickClipsPanel />
        <ConnectedFriendsPanel friends={connectedFriends} />
      </div>
    </div>
  );
}
