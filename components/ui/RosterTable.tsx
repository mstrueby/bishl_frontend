import React from "react";
import { CldImage } from "next-cloudinary";
import { RosterPlayer } from "../../types/MatchValues";

export interface RosterTableProps {
  teamName: string;
  roster: RosterPlayer[];
  isPublished: boolean;
  numOfPeriods: number;
}

const sortRosterPlayers = (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
  if (!rosterToSort || rosterToSort.length === 0) return [];
  const positionPriority: Record<string, number> = { C: 1, A: 2, G: 3, F: 4 };
  return [...rosterToSort].sort((a, b) => {
    const posA = positionPriority[a.playerPosition.key] ?? 99;
    const posB = positionPriority[b.playerPosition.key] ?? 99;
    if (posA !== posB) return posA - posB;
    return a.player.jerseyNumber - b.player.jerseyNumber;
  });
};

const RosterTable: React.FC<RosterTableProps> = ({
  teamName,
  roster,
  isPublished,
  numOfPeriods,
}) => {
  const sortedRoster = sortRosterPlayers(roster || []);
  const hasGoalies = sortedRoster.some((p) => p.playerPosition.key === "G");

  return (
    <div className="w-full">
      <div className="text-left mb-3 block md:hidden">
        <h4 className="text-md font-semibold">{teamName}</h4>
      </div>
      <div className="overflow-x-auto bg-white shadow-md rounded-md border">
        {isPublished && sortedRoster && sortedRoster.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nr.
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pos.
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spieler
                </th>
                {hasGoalies && (
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" />
                )}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  V
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRoster.map((player) => {
                const isGoalie = player.playerPosition.key === "G";
                return (
                  <tr key={player.player.playerId}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-8 text-center">
                      {player.player.jerseyNumber}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-4 text-center">
                      {player.playerPosition.key}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-x-3">
                        {player.player.imageUrl && player.player.imageVisible ? (
                          <CldImage
                            src={player.player.imageUrl}
                            alt={`${player.player.displayFirstName} ${player.player.displayLastName}`}
                            width={32}
                            height={32}
                            gravity="center"
                            radius="max"
                            className="w-8 h-8 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {player.player.displayFirstName?.charAt(0)}
                              {player.player.displayLastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span>
                          {player.player.displayFirstName}{" "}
                          {player.player.displayLastName}
                        </span>
                      </div>
                    </td>
                    {hasGoalies && (
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        {isGoalie ? (
                          <div className="flex items-center justify-center gap-1">
                            {Array.from(
                              { length: numOfPeriods },
                              (_, i) => i + 1,
                            ).map((period) => {
                              const played = (
                                player.periodsPlayed ?? []
                              ).includes(period);
                              return played ? (
                                <span
                                  key={period}
                                  className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-white"
                                >
                                  {period}
                                </span>
                              ) : (
                                <span
                                  key={period}
                                  className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-400"
                                >
                                  {period}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.goals || 0}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.assists || 0}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {!isPublished
              ? "Aufstellung noch nicht eingereicht"
              : "Keine Aufstellung verfügbar"}
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterTable;
