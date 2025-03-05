import { useState, useEffect, Fragment } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Dialog, Transition } from '@headlessui/react';
import { Match } from '../../types/MatchValues';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs, allFinishTypes } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import MatchStatusBadge from '../../components/ui/MatchStatusBadge';
import FinishTypeSelect from '../../components/admin/ui/FinishTypeSelect';

interface MatchDetailsProps {
  match: Match;
  jwt?: string;
  userRoles?: string[];
}

interface EditMatchData {
  venue: { name: string; alias: string };
  startDate: string;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  homeScore: number;
  awayScore: number;
}

const tabs = [
  { id: 'roster', name: 'Aufstellung' },
  { id: 'goals', name: 'Tore' },
  { id: 'penalties', name: 'Strafen' },
]

export default function MatchDetails({ match: initialMatch, jwt, userRoles }: MatchDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');
  const [match, setMatch] = useState<Match>(initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFinishType, setSelectedFinishType] = useState({ key: "REGULAR", value: "Regulär" });
  const [editData, setEditData] = useState<EditMatchData>({
    venue: match.venue,
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
    matchStatus: match.matchStatus,
    finishType: match.finishType,
    homeScore: match.home.stats.goalsFor,
    awayScore: match.away.stats.goalsFor
  });
  const router = useRouter();
  const { id } = router.query;

  // Refresh match data function
  const refreshMatchData = async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await fetch(`${process.env.API_URL}/matches/${id}`);
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing match data:', error);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh if match is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (match.matchStatus.key === 'INPROGRESS') {
      interval = setInterval(() => {
        refreshMatchData();
      }, 30000); // Refresh every 30 seconds for live matches
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [match.matchStatus.key, id]);



  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-4">

        {/* Match Header */}
        <div className="flex items-start justify-between sm:flex-row gap-y-2 p-4 border-b mb-6 sm:mb-8 md:mb-12">
          {/* Refresh Button */}
          {match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'CANCELLED' && (
            <button
              onClick={refreshMatchData}
              disabled={isRefreshing}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              title="Aktualisieren"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Tournament Badge */}
          <div className="">
            {tournamentConfigs.map(item =>
              item.name === match.tournament.name && (
                <span
                  key={item.tiny_name}
                  className={classNames("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", item.bdg_col_light)}
                >
                  {item.tiny_name} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                </span>
              )
            )}
          </div>
          {/* Match StartDate, Venue */}
          <div className="flex flex-col items-end gap-y-2">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span className="hidden sm:block text-sm uppercase font-light text-gray-700">
                <time dateTime={
                  match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
                }>
                  {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                    timeZone: 'Europe/Berlin',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'offen'}
                </time> Uhr
              </span>
              <span className="block sm:hidden text-sm uppercase font-light text-gray-700">
                <time dateTime={
                  match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
                }>
                  {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                    timeZone: 'Europe/Berlin',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'offen'}
                </time>
              </span>
            </div>
            <div className="flex items-center truncate">
              <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
              <p className="text-sm uppercase font-light text-gray-700 truncate">{match.venue.name}</p>
            </div>
          </div>
        </div>

        {/* Match Title */}
        {/* Teams and Score */}
        <div className="flex justify-between items-center">
          {/* Home Team */}
          <div className="text-center w-1/3">
            <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
              <CldImage
                src={match.home.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                alt={match.home.tinyName}
                width={100}
                height={100}
                gravity="center"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="block sm:hidden text-xl font-bold truncate">{match.home.tinyName}</h2>
            <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.home.shortName}</h2>
            <h2 className="hidden md:block text-xl font-bold truncate">{match.home.fullName}</h2>
          </div>

          {/* Score */}
          <div className="text-center w-1/3">
            <div className="mb-2 sm:mb-4">
              <MatchStatusBadge
                statusKey={match.matchStatus.key}
                finishTypeKey={match.finishType.key}
                statusValue={match.matchStatus.value}
                finishTypeValue={match.finishType.value}
              />
            </div>
            {(() => {
              switch (match.matchStatus.key) {
                case 'SCHEDULED':
                case 'CANCELLED':
                  return null;
                default:
                  return (
                    <div className="text-2xl sm:text-4xl font-bold space-x-1 sm:space-x-4">
                      <span>{match.home.stats.goalsFor}</span>
                      <span>:</span>
                      <span>{match.away.stats.goalsFor}</span>
                    </div>
                  );
              }
            })()}
          </div>

          {/* Away Team */}
          <div className="text-center w-1/3">
            <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
              <CldImage
                src={match.away.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                alt={match.away.tinyName}
                width={100}
                height={100}
                gravity="center"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="block sm:hidden text-xl font-bold truncate">{match.away.tinyName}</h2>
            <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.away.shortName}</h2>
            <h2 className="hidden md:block text-xl font-bold truncate">{match.away.fullName}</h2>
          </div>
        </div>

        {/* Team Buttons in Separate Row */}
        <div className="flex justify-between mt-6 mb-4">
          {/* Home Team Buttons */}
          <div className="w-1/3 flex justify-center">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => router.push(`/matches/${match._id}/roster/home`)}
                className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aufstellung
              </button>
              {match.matchStatus.key === 'INPROGRESS' && (
                <>
                  <button
                    onClick={() => {
                      // Open dialog to add a new goal
                      // Will call POST API endpoint /matches/id/home/scores
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Tor
                  </button>
                  <button
                    onClick={() => {
                      // Open dialog to add a new penalty
                      // Will call POST API endpoint /matches/id/home/penalties
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Strafe
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Middle Section with Start/Finish Button */}
          <div className="w-1/3 flex justify-center items-center">
            {jwt && (userRoles?.includes('ADMIN') || userRoles?.includes('LEAGUE_ADMIN')) && (
              <>
                {match.matchStatus.key === 'SCHEDULED' && (
                  <button
                    onClick={async () => {
                      try {
                        setIsRefreshing(true);
                        const response = await axios.patch(`${process.env.API_URL}/matches/${match._id}`, {
                          matchStatus: {
                            key: "INPROGRESS",
                            value: "Live"
                          }
                        }, {
                          headers: {
                            Authorization: `Bearer ${jwt}`,
                            'Content-Type': 'application/json'
                          }
                        });

                        if (response.status === 200) {
                          // Update local state instead of reloading
                          const updatedMatch = response.data;
                          setMatch(updatedMatch);
                        }
                      } catch (error) {
                        console.error('Error updating match status:', error);
                      } finally {
                        setIsRefreshing(false);
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {isRefreshing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                        </svg>
                        Starten
                      </>
                    ) : (
                      'Starten'
                    )}
                  </button>
                )}

                {match.matchStatus.key === 'INPROGRESS' && (
                  <button
                    onClick={() => setIsFinishDialogOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {isRefreshing ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                      </svg>
                    ) : (
                      'Beenden'
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Away Team Buttons */}
          <div className="w-1/3 flex justify-center">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => router.push(`/matches/${match._id}/roster/away`)}
                className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aufstellung
              </button>
              {match.matchStatus.key === 'INPROGRESS' && (
                <>
                  <button
                    onClick={() => {
                      // Open dialog to add a new goal
                      // Will call POST API endpoint /matches/id/away/scores
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Tor
                  </button>
                  <button
                    onClick={() => {
                      // Open dialog to add a new penalty
                      // Will call POST API endpoint /matches/id/away/penalties
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Strafe
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sub navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav aria-label="Tabs" className="-mb-px flex justify-center px-0 sm:px-4 md:px-12">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={classNames(
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'w-1/3 border-b-2 px-1 py-4 text-center text-sm font-medium',
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="py-6">
          {activeTab === 'roster' && (
            <div className="py-4">
              {/* Sort function for roster */}
              {(() => {
                // Sort roster by position order: C, A, G, F, then by jersey number
                const sortRoster = (rosterToSort) => {
                  if (!rosterToSort || rosterToSort.length === 0) return [];

                  return [...rosterToSort].sort((a, b) => {
                    // Define position priorities (C = 1, A = 2, G = 3, F = 4)
                    const positionPriority = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

                    // Get priorities
                    const posA = positionPriority[a.playerPosition.key] || 99;
                    const posB = positionPriority[b.playerPosition.key] || 99;

                    // First sort by position priority
                    if (posA !== posB) {
                      return posA - posB;
                    }

                    // If positions are the same, sort by jersey number
                    return a.player.jerseyNumber - b.player.jerseyNumber;
                  });
                };

                // Sort rosters
                const sortedHomeRoster = sortRoster(match.home.roster);
                const sortedAwayRoster = sortRoster(match.away.roster);

                return (
                  <div className="flex flex-col md:flex-row md:space-x-4">
                    {/* Home team roster */}
                    <div className="w-full md:w-1/2 mb-6 md:mb-0">
                      <div className="text-center mb-3">
                        <h4 className="text-md font-semibold">{match.home.fullName}</h4>
                      </div>
                      <div className="overflow-hidden bg-white shadow-md rounded-md border">
                        {match.home.rosterPublished && sortedHomeRoster && sortedHomeRoster.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedHomeRoster.map((player) => (
                                <tr key={player.player.playerId}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-8 text-center">{player.player.jerseyNumber}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-4">{player.playerPosition.key}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <span>{player.player.firstName} {player.player.lastName}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">

                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                      {player.passNumber}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
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
                            {match.home.rosterPublished === false ? 'Aufstellung noch nicht veröffentlicht' : 'Keine Aufstellung verfügbar'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Away team roster */}
                    <div className="w-full md:w-1/2">
                      <div className="text-center mb-3">
                        <h4 className="text-md font-semibold">{match.away.fullName}</h4>
                      </div>
                      <div className="overflow-hidden bg-white shadow-md rounded-md border">
                        {match.away.rosterPublished && sortedAwayRoster && sortedAwayRoster.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedAwayRoster.map((player) => (
                                <tr key={player.player.playerId}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-8 text-center">{player.player.jerseyNumber}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-4">{player.playerPosition.key}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <span>{player.player.firstName} {player.player.lastName}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">

                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                      {player.passNumber}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
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
                            {match.away.rosterPublished === false ? 'Aufstellung noch nicht veröffentlicht' : 'Keine Aufstellung verfügbar'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="py-4">
              {/* Container for side-by-side or stacked goals */}
              <div className="flex flex-col md:flex-row md:space-x-4">
                {/* Home team goals */}
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.home.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.home.scores && match.home.scores.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        {/*
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spieler</th>
                          </tr>
                        </thead>
                        */}
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Sort goals by matchSeconds and map them */}
                          {match.home.scores
                            //.sort((a, b) => a.matchSeconds - b.matchSeconds)
                            .map((goal, index) => (
                              <tr key={`home-goal-${index}`}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-16">
                                  {goal.matchTime}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  <p>{goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.firstName} ${goal.goalPlayer.lastName}` : 'Unbekannt'}</p><p className="text-xs text-gray-500">
                                    {goal.assistPlayer ? `#${goal.assistPlayer.jerseyNumber} ${goal.assistPlayer.firstName} ${goal.assistPlayer.lastName}` : ''}</p>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Tore vorhanden
                      </div>
                    )}
                  </div>
                </div>

                {/* Away team goals */}
                <div className="w-full md:w-1/2">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.away.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.away.scores && match.away.scores.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        {/*
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spieler</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assist</th>
                          </tr>
                        </thead>
                        */}
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Sort goals by matchSeconds and map them */}
                          {match.away.scores
                            //.sort((a, b) => a.matchSeconds - b.matchSeconds)
                            .map((goal, index) => (
                              <tr key={`away-goal-${index}`}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-16">
                                  {goal.matchTime}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  <p>{goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.firstName} ${goal.goalPlayer.lastName}` : 'Unbekannt'}</p><p className="text-xs text-gray-500">
                                    {goal.assistPlayer ? `#${goal.assistPlayer.jerseyNumber} ${goal.assistPlayer.firstName} ${goal.assistPlayer.lastName}` : ''}</p>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Tore vorhanden
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'penalties' && (
            <div className="py-4">
              {/* Container for side-by-side or stacked penalties */}
              <div className="flex flex-col md:flex-row md:space-x-4">
                {/* Home team penalties */}
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.home.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.home.penalties && match.home.penalties.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {match.home.penalties.map((penalty, index) => (
                            <tr key={`home-penalty-${index}`}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-16">
                                {penalty.matchTimeStart}
                                {penalty.matchTimeEnd && ` - ${penalty.matchTimeEnd}`}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <p>
                                  {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.firstName} ${penalty.penaltyPlayer.lastName}` : 'Unbekannt'}
                                  {penalty.isGM && ' (GM)'}
                                  {penalty.isMP && ' (MP)'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Object.values(penalty.penaltyCode).join(', ')} - {penalty.penaltyMinutes} Min.
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Strafen vorhanden
                      </div>
                    )}
                  </div>
                </div>

                {/* Away team penalties */}
                <div className="w-full md:w-1/2">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.away.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.away.penalties && match.away.penalties.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {match.away.penalties.map((penalty, index) => (
                            <tr key={`away-penalty-${index}`}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-16">
                                {penalty.matchTimeStart}
                                {penalty.matchTimeEnd && ` - ${penalty.matchTimeEnd}`}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <p>
                                  {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.firstName} ${penalty.penaltyPlayer.lastName}` : 'Unbekannt'}
                                  {penalty.isGM && ' (GM)'}
                                  {penalty.isMP && ' (MP)'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {Object.values(penalty.penaltyCode).join(', ')} - {penalty.penaltyMinutes} Min.
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Strafen vorhanden
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Finish Match Dialog */}
      <Transition appear show={isFinishDialogOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10" onClose={() => setIsFinishDialogOpen(false)}>
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-30" />
              </Transition.Child>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg text-center font-bold leading-6 text-gray-900 mb-4">
                    Spiel beenden
                  </Dialog.Title>

                  <div className="mt-4 mb-24">
                    <FinishTypeSelect
                      selectedType={selectedFinishType}
                      types={allFinishTypes}
                      onTypeChange={(typeKey) => {
                        const selectedType = allFinishTypes.find(t => t.key === typeKey);
                        if (selectedType) {
                          setSelectedFinishType({
                            key: typeKey,
                            value: selectedType.value
                          });
                        }
                      }}
                      label="Art des Spielendes"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => setIsFinishDialogOpen(false)}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={async () => {
                        try {
                          setIsRefreshing(true);
                          const response = await axios.patch(`${process.env.API_URL}/matches/${match._id}`, {
                            matchStatus: {
                              key: "FINISHED",
                              value: "Beendet"
                            },
                            finishType: selectedFinishType
                          }, {
                            headers: {
                              Authorization: `Bearer ${jwt}`,
                              'Content-Type': 'application/json'
                            }
                          });

                          if (response.status === 200) {
                            // Update local state
                            const updatedMatch = response.data;
                            setMatch(updatedMatch);
                            setIsFinishDialogOpen(false);
                          }
                        } catch (error) {
                          console.error('Error finishing match:', error);
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                    >
                      {isRefreshing ?
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                        </svg>
                        : null}
                      Spiel beenden
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>d
        </Dialog>
      </Transition>
    </Layout >
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const jwt = (getCookie('jwt', context) || '') as string;

  try {
    const match = await fetch(`${process.env.API_URL}/matches/${id}`).then(res => res.json());

    let userRoles: string[] = [];
    if (jwt) {
      const userResponse = await fetch(`${process.env.API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const userData = await userResponse.json();
      userRoles = userData.roles || [];
    }

    return {
      props: {
        match,
        jwt,
        userRoles,
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};