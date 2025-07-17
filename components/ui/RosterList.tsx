import React from 'react';
import Link from 'next/link';
import { RosterPlayer } from '../../types/MatchValues';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

interface RosterListProps {
  teamName: string;
  roster: RosterPlayer[];
  isPublished: boolean;
  showEditButton?: boolean;
  editUrl?: string;
  sortRoster?: (roster: RosterPlayer[]) => RosterPlayer[];
  playerStats?: {[playerId: string]: number};
}

const RosterList: React.FC<RosterListProps> = ({
  teamName,
  roster,
  isPublished,
  showEditButton = false,
  editUrl,
  sortRoster,
  playerStats
}) => {
  // Default sort function if none provided
  const defaultSortRoster = (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
    if (!rosterToSort || rosterToSort.length === 0) return [];

    return [...rosterToSort].sort((a, b) => {
      // Define position priorities (C = 1, A = 2, G = 3, F = 4)
      const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

      // Get priorities
      const posA = positionPriority[a.playerPosition.key] || 99;
      const posB = positionPriority[b.playerPosition.key] || 99;

      // First sort by position priority
      if (posA !== posB) {
        return posA - posB;
      }

      // If positions are the same, sort by jersey number
      const jerseyA = a.player.jerseyNumber || 999;
      const jerseyB = b.player.jerseyNumber || 999;
      return jerseyA - jerseyB;
    });
  };

  const sortedRoster = sortRoster ? sortRoster(roster) : defaultSortRoster(roster);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b mb-3 border-gray-200 pb-3 flex items-center justify-between mt-3 sm:mt-0 sm:mx-3 min-h-[2.5rem]">
        <h3 className="text-md font-semibold text-gray-900 py-1.5 truncate">{teamName}</h3>
        <div className="flex items-center">
          {showEditButton && editUrl && (
            <Link href={editUrl}>
              <a className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Bearbeiten
              </a>
            </Link>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-auto bg-white shadow-md rounded-md border">
        {isPublished && sortedRoster && sortedRoster.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900 text-sm">
              {sortedRoster.map((player) => (
                <tr key={player.player.playerId} className="h-11">
                  <td className="px-3 py-2 whitespace-nowrap w-8 text-center">
                    {player.player.jerseyNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap w-4">
                    {player.playerPosition.key}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {player.player.lastName}, {player.player.firstName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">

                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {player.passNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {player.called && playerStats !== undefined? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset
                       ${playerStats[player.player.playerId] >= 0 && playerStats[player.player.playerId] <= 3
                          ? 'bg-green-50 text-green-800 ring-green-600/20'
                          : playerStats[player.player.playerId] === 4
                          ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                          : 'bg-red-50 text-red-800 ring-red-600/20'}`}>
                        <ArrowUpIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        <span className="hidden lg:block">Hochgemeldet</span>
                        {playerStats[player.player.playerId] !== undefined && (
                          <span className="ml-1 sm:ml-2 inline-flex items-center gap-x-2 mr-1">
                            <svg viewBox="0 0 2 2" className="hidden lg:block h-0.5 w-0.5 fill-current">
                              <circle r={1} cx={1} cy={1} />
                            </svg>
                            <span className="text-xs font-medium">
                              {playerStats[player.player.playerId]}
                            </span>
                          </span>
                        )}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-5 text-sm text-gray-500">
            {!isPublished ? 'Aufstellung nicht veröffentlicht' : 'Keine Spieler eingetragen'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterList;
