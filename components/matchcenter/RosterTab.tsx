
import React from 'react';
import { MatchValues } from '../../types/MatchValues';
import RosterList from '../ui/RosterList';

interface RosterTabProps {
  match: MatchValues;
  permissions: {
    showButtonRosterHome: boolean;
    showButtonRosterAway: boolean;
  };
  homePlayerStats: { [playerId: string]: number };
  awayPlayerStats: { [playerId: string]: number };
}

const RosterTab: React.FC<RosterTabProps> = ({
  match,
  permissions,
  homePlayerStats,
  awayPlayerStats,
}) => {
  // Sort roster by position order: C, A, G, F, then by jersey number
  const sortRoster = (rosterToSort: any[]) => {
    if (!rosterToSort || rosterToSort.length === 0) return [];

    return [...rosterToSort].sort((a, b) => {
      const positionPriority = { C: 1, A: 2, G: 3, F: 4 };
      const posA = positionPriority[a.playerPosition.key as keyof typeof positionPriority] || 99;
      const posB = positionPriority[b.playerPosition.key as keyof typeof positionPriority] || 99;

      if (posA !== posB) {
        return posA - posB;
      }

      return a.player.jerseyNumber - b.player.jerseyNumber;
    });
  };

  const sortedHomeRoster = sortRoster(match.home.roster || []);
  const sortedAwayRoster = sortRoster(match.away.roster || []);

  return (
    <div className="flex flex-col md:flex-row md:space-x-8">
      <div className="w-full md:w-1/2 mb-6 md:mb-0">
        <RosterList
          teamName={match.home.fullName}
          roster={sortedHomeRoster}
          isPublished={match.home.rosterPublished || false}
          showEditButton={permissions.showButtonRosterHome}
          editUrl={`/matches/${match._id}/home/roster?from=matchcenter`}
          sortRoster={sortRoster}
          playerStats={homePlayerStats}
        />
      </div>
      <div className="w-full md:w-1/2">
        <RosterList
          teamName={match.away.fullName}
          roster={sortedAwayRoster}
          isPublished={match.away.rosterPublished || false}
          showEditButton={permissions.showButtonRosterAway}
          editUrl={`/matches/${match._id}/away/roster?from=matchcenter`}
          sortRoster={sortRoster}
          playerStats={awayPlayerStats}
        />
      </div>
    </div>
  );
};

export default RosterTab;
