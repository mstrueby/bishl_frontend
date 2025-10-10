
import React from 'react';
import { Match, ScoresBase } from '../../types/MatchValues';
import ScoreList from '../ui/ScoreList';

interface GoalsTabProps {
  match: Match;
  jwt: string;
  permissions: {
    showButtonScoresHome: boolean;
    showButtonScoresAway: boolean;
    showButtonEvents: boolean;
  };
  refreshMatchData: () => void;
  setIsHomeGoalDialogOpen: (open: boolean) => void;
  setIsAwayGoalDialogOpen: (open: boolean) => void;
  setEditingHomeGoal: (goal: ScoresBase | undefined) => void;
  setEditingAwayGoal: (goal: ScoresBase | undefined) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({
  match,
  jwt,
  permissions,
  refreshMatchData,
  setIsHomeGoalDialogOpen,
  setIsAwayGoalDialogOpen,
  setEditingHomeGoal,
  setEditingAwayGoal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:space-x-8">
      <div className="w-full md:w-1/2 mb-6 md:mb-0">
        <ScoreList
          jwt={jwt}
          teamName={match.home.fullName}
          matchId={match._id}
          teamFlag="home"
          scores={match.home.scores || []}
          showEditButton={permissions.showButtonScoresHome}
          editUrl={`/matches/${match._id}/home/scores`}
          showEventButtons={permissions.showButtonEvents}
          refreshMatchData={refreshMatchData}
          setIsGoalDialogOpen={setIsHomeGoalDialogOpen}
          setEditingGoal={setEditingHomeGoal}
        />
      </div>
      <div className="w-full md:w-1/2">
        <ScoreList
          jwt={jwt}
          teamName={match.away.fullName}
          matchId={match._id}
          teamFlag="away"
          scores={match.away.scores || []}
          showEditButton={permissions.showButtonScoresAway}
          editUrl={`/matches/${match._id}/away/scores`}
          showEventButtons={permissions.showButtonEvents}
          refreshMatchData={refreshMatchData}
          setIsGoalDialogOpen={setIsAwayGoalDialogOpen}
          setEditingGoal={setEditingAwayGoal}
        />
      </div>
    </div>
  );
};

export default GoalsTab;
