// components/ui/Standings.tsx

import React from 'react';
import Image from 'next/image';

interface StandingsTeam {
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  otWins: number;
  otLosses: number;
  soWins: number;
  soLosses: number;
  streak: string[];
}

interface StandingsProps {
  standingsData: Record<string, StandingsTeam>;
  matchSettings: Record<string, string>;
}

const streakColorMap = {
  W: 'bg-green-500',
  L: 'bg-red-500',
  SOW: 'bg-green-200',
  SOL: 'bg-red-200',
  OTL: 'bg-red-200',
  OTW: 'bg-green-200',
  D: 'bg-gray-500',
};

const streakTitleMap = {
  W: 'Sieg',
  L: 'Niederlage',
  SOW: 'Sieg (PS)',
  SOL: 'Niederlage (PS)',
  OTL: 'Niederlage (V)',
  OTW: 'Sieg (V)',
  D: 'Unentschieden',
};

const Standings: React.FC<StandingsProps> = ({ standingsData, matchSettings }) => {
  return (
    <section className="my-10">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 px-2 text-center text-sm font-semibold text-gray-900 sm:px-3">
                      <span className="hidden md:block"></span>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"></th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">GS</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">S</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">N</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">U</th>
                    {matchSettings.overtime && (
                      <>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">SV</th>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">NV</th>
                      </>
                    )}
                    {matchSettings.shootout && (
                      <>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">SPS</th>
                        <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">NPS</th>
                      </>
                    )}
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Pkt</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">T</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">GT</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">TD</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Serie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Object.keys(standingsData).map((teamKey, index) => {
                    const team = standingsData[teamKey];
                    return (
                      <tr key={teamKey}>
                        <td className="whitespace-nowrap py-4 px-2 text-center text-sm sm:px-3">
                          {index + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <Image className="h-8 w-8" src={team.logo ? team.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={team.tinyName} objectFit="contain" height={32} width={32} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <span className="hidden lg:block">{team.fullName}</span>
                                <span className="hidden md:block lg:hidden">{team.shortName}</span>
                                <span className="block md:hidden">{team.tinyName}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.gamesPlayed}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.wins}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.losses}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.draws}</td>
                        {matchSettings.overtime && (
                          <>
                            <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.otWins}</td>
                            <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.otLosses}</td>
                          </>
                        )}
                        {matchSettings.shootout && (
                          <>
                            <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.soWins}</td>
                            <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.soLosses}</td>
                          </>
                        )}
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm font-bold text-gray-500 bg-orange-50">{team.points}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.goalsFor}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.goalsAgainst}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">{team.goalsFor - team.goalsAgainst}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-center text-sm text-gray-500">
                          <div>
                            {team.streak.map((streak, i) => (
                              <span
                                key={i}
                                className={`${streakColorMap[streak as keyof typeof streakColorMap]} inline-block h-3 w-3 rounded-full mx-1`}
                                title={streakTitleMap[streak as keyof typeof streakTitleMap] || 'Unknown'}
                              ></span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={14} className="py-4 px-4">
                      <div className="text-xs text-gray-700">
                        <strong>Legende</strong>
                        <ul className="list-none mt-2">
                          <li><strong>GS</strong>: Gespielte Spiele</li>
                          <li><strong>S</strong>: Siege</li>
                          <li><strong>N</strong>: Niederlagen</li>
                          <li><strong>U</strong>: Unentschieden</li>
                          {matchSettings.overtime && (
                            <>
                              <li><strong>SV</strong>: Siege nach Verlängerung</li>
                              <li><strong>NV</strong>: Niederlagen nach Verlängerung)</li>
                            </>
                          )}
                          {matchSettings.shootout && (
                            <>
                              <li><strong>SPS</strong>: Siege nach Penalty-Schießen)</li>
                              <li><strong>NPS</strong>: Niederlagen nach Penalty-Schießen)</li>
                            </>
                          )}
                          <li><strong>Pkt</strong>: Punkte</li>
                          <li><strong>T</strong>: Tore</li>
                          <li><strong>GT</strong>: Gegentore</li>
                          <li><strong>TD</strong>: Tordifferenz</li>
                          <li><strong>Serie</strong>: Ergenisse der letzten 5 Spiele (neueste sind rechts)</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Standings;