import React from 'react';
import Link from 'next/link';
import { RosterPlayer } from '../../types/MatchValues';

interface RosterListProps {
  teamName: string;
  roster: RosterPlayer[];
  isPublished: boolean;
  showEditButton?: boolean;
  editUrl?: string;
  sortRoster?: (roster: RosterPlayer[]) => RosterPlayer[];
}

const RosterList: React.FC<RosterListProps> = ({
  teamName,
  roster,
  isPublished,
  showEditButton = false,
  editUrl,
  sortRoster
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
      <div className="border-b mb-3 border-gray-200 pb-3 flex items-center justify-between mt-3 sm:mt-0 sm:mx-3">
        <h3 className="text-md font-semibold text-gray-900 truncate">{teamName}</h3>
        {showEditButton && editUrl && (
          <Link href={editUrl}>
            <a className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Bearbeiten
            </a>
          </Link>
        )}
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
                    {player.called && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Hochgemeldet</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {!isPublished ? 'Aufstellung nicht veröffentlicht' : 'Keine Spieler eingetragen'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterList;
