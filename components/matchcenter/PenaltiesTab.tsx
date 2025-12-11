
import React from 'react';
import { MatchValues, PenaltiesBase } from '../../types/MatchValues';
import PenaltyList from '../ui/PenaltyList';

interface PenaltiesTabProps {
  match: MatchValues;
  permissions: {
    showButtonPenaltiesHome: boolean;
    showButtonPenaltiesAway: boolean;
    showButtonEvents: boolean;
  };
  refreshMatchData: () => void;
  setIsHomePenaltyDialogOpen: (open: boolean) => void;
  setIsAwayPenaltyDialogOpen: (open: boolean) => void;
  setEditingHomePenalty: (penalty: PenaltiesBase | undefined) => void;
  setEditingAwayPenalty: (penalty: PenaltiesBase | undefined) => void;
}

const PenaltiesTab: React.FC<PenaltiesTabProps> = ({
  match,
  permissions,
  refreshMatchData,
  setIsHomePenaltyDialogOpen,
  setIsAwayPenaltyDialogOpen,
  setEditingHomePenalty,
  setEditingAwayPenalty,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:space-x-8">
      <div className="w-full md:w-1/2 mb-6 md:mb-0">
        <PenaltyList
          teamName={match.home.fullName}
          matchId={match._id}
          teamFlag="home"
          penalties={match.home.penalties || []}
          showEditButton={permissions.showButtonPenaltiesHome}
          editUrl={`/matches/${match._id}/home/penalties`}
          showEventButtons={permissions.showButtonEvents}
          refreshMatchData={refreshMatchData}
          setIsPenaltyDialogOpen={setIsHomePenaltyDialogOpen}
          setEditingPenalty={setEditingHomePenalty}
        />
      </div>
      <div className="w-full md:w-1/2">
        <PenaltyList
          teamName={match.away.fullName}
          matchId={match._id}
          teamFlag="away"
          penalties={match.away.penalties || []}
          showEditButton={permissions.showButtonPenaltiesAway}
          editUrl={`/matches/${match._id}/away/penalties`}
          showEventButtons={permissions.showButtonEvents}
          refreshMatchData={refreshMatchData}
          setIsPenaltyDialogOpen={setIsAwayPenaltyDialogOpen}
          setEditingPenalty={setEditingAwayPenalty}
        />
      </div>
    </div>
  );
};

export default PenaltiesTab;
