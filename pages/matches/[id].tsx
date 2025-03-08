import { useState, useEffect, useCallback, Fragment } from 'react';
import useAuth from '../../hooks/useAuth';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Dialog, Transition } from '@headlessui/react';
import { Match, RosterPlayer, PenaltiesBase, ScoresBase } from '../../types/MatchValues';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs, allFinishTypes } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import MatchStatusBadge from '../../components/ui/MatchStatusBadge';
import FinishTypeSelect from '../../components/admin/ui/FinishTypeSelect';
import AddGoalDialog from '../../components/ui/AddGoalDialog';
import AddPenaltyDialog from '../../components/ui/AddPenaltyDialog';

interface MatchDetailsProps {
  match: Match;
  jwt?: string;
  userRoles?: string[];
  userClubId?: string | null;
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

export default function MatchDetails({ match: initialMatch, jwt, userRoles, userClubId }: MatchDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');
  const [match, setMatch] = useState<Match>(initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFinishType, setSelectedFinishType] = useState({ key: "REGULAR", value: "Regulär" });
  const [isHomeGoalDialogOpen, setIsHomeGoalDialogOpen] = useState(false);
  const [isAwayGoalDialogOpen, setIsAwayGoalDialogOpen] = useState(false);
  const [isHomePenaltyDialogOpen, setIsHomePenaltyDialogOpen] = useState(false);
  const [isAwayPenaltyDialogOpen, setIsAwayPenaltyDialogOpen] = useState(false);
  const [editingHomePenalty, setEditingHomePenalty] = useState<PenaltiesBase | null>(null);
  const [editingAwayPenalty, setEditingAwayPenalty] = useState<PenaltiesBase | null>(null);
  const [editingHomeGoal, setEditingHomeGoal] = useState<ScoresBase | null>(null);
  const [editingAwayGoal, setEditingAwayGoal] = useState<ScoresBase | null>(null);
  const [editData, setEditData] = useState<EditMatchData>({
    venue: match.venue,
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
    matchStatus: match.matchStatus,
    finishType: match.finishType,
    homeScore: match.home.stats.goalsFor,
    awayScore: match.away.stats.goalsFor
  });
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Refresh match data function
  const refreshMatchData = useCallback(async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`);
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing match data:', error);
      setIsRefreshing(false);
    }
  }, [id, isRefreshing]);

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
  }, [match.matchStatus.key, id, refreshMatchData]);

  let showLinkEdit = false;
  let showLinkStatus = false;
  let showButtonRosterHome = false;
  let showButtonRosterAway = false;
  let showMatchSheet = true;
  let showButtonStatus = false;
  let showButtonEvents = false;

  {/** LEAGE_ADMIN */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN'))) {
    showButtonStatus = true;
    showButtonEvents = true;
  }
  {/** LEAGUE-ADMIN && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterHome = true;
    showButtonRosterAway = true;
    //showButtonStatus = true;
  }
  {/** LEAGE_ADMIN && Spiel läuft */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN')) && match.matchStatus.key === 'INPROGRESS') {
    showButtonRosterHome = true;
    showButtonRosterAway = true;
  }
  {/** Heim Vereins-Account */ }
  if (user && (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN'))) {
    showButtonRosterHome = true;
    //showButtonEvents = true;
  }
  {/** Home-Account && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
    showButtonStatus = true;
  }
  {/** Home-Account && Spiel läuft */ }
  if (user && (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN')) && match.matchStatus.key === 'INPROGRESS') {
    showButtonRosterAway = true;
    showButtonStatus = true;
    showButtonEvents = true;
  }
  {/** Away-Account && Spiel weiter als 30 Minuten in der Zukunft  */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() > Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
  }
  {/** Away-Account && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
  }
  {/** Away-Account && Spiel läuft */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && match.matchStatus.key === 'INPROGRESS') {
    showButtonRosterAway = false;
  }
  {/**
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN'))) {
    showButtonRosterAway = true;
  }
  */}
  if (match.season.alias !== process.env['NEXT_PUBLIC_CURRENT_SEASON'] || (match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'INPROGRESS')) {
    showButtonStatus = false;
    showButtonRosterHome = false;
    showButtonRosterAway = false;
    showButtonEvents = false;
  }
  {/** ADMIN  */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN'))) {
    //showButtonStatus = true;
    showButtonRosterHome = true;
    showButtonRosterAway = true;
    //showButtonEvents = true;
  }
  

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
              {showButtonRosterHome && (
                <button
                  onClick={() => router.push(`/matches/${match._id}/roster/home`)}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Aufstellung
                </button>
              )}
              {showButtonEvents && match.matchStatus.key === "INPROGRESS" && (
                <>
                  <button
                    onClick={() => setIsHomeGoalDialogOpen(true)}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Tor
                  </button>
                  <button
                    onClick={() => setIsHomePenaltyDialogOpen(true)}
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
            {showButtonStatus && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000 && (
              <>
                {match.matchStatus.key === 'SCHEDULED' && (
                  <button
                    onClick={async () => {
                      try {
                        setIsRefreshing(true);
                        const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`, {
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

                {match.matchStatus.key === 'INPROGRESS' && showButtonStatus && (
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
              {showButtonRosterAway && (
                <button
                  onClick={() => router.push(`/matches/${match._id}/roster/away`)}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Aufstellung
                </button>
              )}
              {showButtonEvents && match.matchStatus.key === "INPROGRESS" && (
                <>
                  <button
                    onClick={() => setIsAwayGoalDialogOpen(true)}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-md text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Tor
                  </button>
                  <button
                    onClick={() => setIsAwayPenaltyDialogOpen(true)}
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
                const sortRoster = (rosterToSort: RosterPlayer[]) => {
                  if (!rosterToSort || rosterToSort.length === 0) return [];

                  return [...rosterToSort].sort((a, b) => {
                    // Define position priorities (C = 1, A = 2, G = 3, F = 4)
                    const positionPriority = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

                    // Get priorities
                    const posA = positionPriority[a.playerPosition.key as keyof typeof positionPriority] || 99;
                    const posB = positionPriority[b.playerPosition.key as keyof typeof positionPriority] || 99;

                    // First sort by position priority
                    if (posA !== posB) {
                      return posA - posB;
                    }

                    // If positions are the same, sort by jersey number
                    return a.player.jerseyNumber - b.player.jerseyNumber;
                  });
                };

                // Sort rosters
                const sortedHomeRoster = sortRoster(match.home.roster || []);
                const sortedAwayRoster = sortRoster(match.away.roster || []);

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
                      <ul className="divide-y divide-gray-200">
                        {match.home.scores
                          .sort((a, b) => {
                            // Convert matchTime (format: "mm:ss") to seconds for comparison
                            const timeA = a.matchTime.split(":").map(Number);
                            const timeB = b.matchTime.split(":").map(Number);
                            const secondsA = timeA[0] * 60 + timeA[1];
                            const secondsB = timeB[0] * 60 + timeB[1];
                            return secondsA - secondsB;
                          })
                          .map((goal, index) => (
                            <li key={`home-goal-${index}`} className="flex items-center py-3 px-4">
                              <div className="w-16 flex-shrink-0 text-sm text-gray-900">
                                {goal.matchTime}
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm text-gray-900">
                                  {goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.firstName} ${goal.goalPlayer.lastName}` : 'Unbekannt'}
                                </p>
                                {goal.assistPlayer && (
                                  <p className="text-xs text-gray-500">
                                    #{goal.assistPlayer.jerseyNumber} {goal.assistPlayer.firstName} {goal.assistPlayer.lastName}
                                  </p>
                                )}
                              </div>
                              {showButtonEvents && (
                                <div className="flex justify-end space-x-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setIsHomeGoalDialogOpen(true);
                                      setEditingHomeGoal(goal);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm("Sind Sie sicher, dass Sie dieses Tor löschen möchten?")) {
                                        try {
                                          const response = await axios.delete(
                                            `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}/home/scores/${goal._id}`,
                                            {
                                              headers: {
                                                Authorization: `Bearer ${jwt}`,
                                                'Content-Type': 'application/json'
                                              }
                                            }
                                          );
                                          if (response.status === 200 || response.status === 204) {
                                            refreshMatchData();
                                          }
                                        } catch (error) {
                                          console.error('Error deleting goal:', error);
                                        }
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>
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
                      <ul className="divide-y divide-gray-200">
                        {match.away.scores
                          .sort((a, b) => {
                            // Convert matchTime (format: "mm:ss") to seconds for comparison
                            const timeA = a.matchTime.split(":").map(Number);
                            const timeB = b.matchTime.split(":").map(Number);
                            const secondsA = timeA[0] * 60 + timeA[1];
                            const secondsB = timeB[0] * 60 + timeB[1];
                            return secondsA - secondsB;
                          })
                          .map((goal, index) => (
                            <li key={`away-goal-${index}`} className="flex items-center py-3 px-4">
                              <div className="w-16 flex-shrink-0 text-sm text-gray-900">
                                {goal.matchTime}
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm text-gray-900">
                                  {goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.firstName} ${goal.goalPlayer.lastName}` : 'Unbekannt'}
                                </p>
                                {goal.assistPlayer && (
                                  <p className="text-xs text-gray-500">
                                    #{goal.assistPlayer.jerseyNumber} {goal.assistPlayer.firstName} {goal.assistPlayer.lastName}
                                  </p>
                                )}
                              </div>
                              {showButtonEvents && (
                                <div className="flex justify-end space-x-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setIsAwayGoalDialogOpen(true);
                                      setEditingAwayGoal(goal);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm("Sind Sie sicher, dass Sie dieses Tor löschen möchten?")) {
                                        try {
                                          const response = await axios.delete(
                                            `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}/away/scores/${goal._id}`,
                                            {
                                              headers: {
                                                Authorization: `Bearer ${jwt}`,
                                                'Content-Type': 'application/json'
                                              }
                                            }
                                          );
                                          if (response.status === 200 || response.status === 204) {
                                            refreshMatchData();
                                          }
                                        } catch (error) {
                                          console.error('Error deleting goal:', error);
                                        }
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>
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
                      <ul className="divide-y divide-gray-200">
                        {match.home.penalties
                          .sort((a, b) => {
                            // Convert matchTimeStart (format: "mm:ss") to seconds for comparison
                            const timeA = a.matchTimeStart.split(":").map(Number);
                            const timeB = b.matchTimeStart.split(":").map(Number);
                            const secondsA = timeA[0] * 60 + timeA[1];
                            const secondsB = timeB[0] * 60 + timeB[1];
                            return secondsA - secondsB;
                          })
                          .map((penalty, index) => (
                          <li key={`home-penalty-${index}`} className="flex items-center py-3 px-4">
                            <div className="w-20 flex-shrink-0 text-sm text-gray-900">
                              {penalty.matchTimeStart}
                              {penalty.matchTimeEnd && ` - ${penalty.matchTimeEnd}`}
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm text-gray-900">
                                {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.firstName} ${penalty.penaltyPlayer.lastName}` : 'Unbekannt'}
                                {penalty.isGM && ' (GM)'}
                                {penalty.isMP && ' (MP)'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {Object.values(penalty.penaltyCode).join(', ')} - {penalty.penaltyMinutes} Min.
                              </p>
                            </div>
                            {showButtonEvents && (
                              <div className="flex justify-end space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingHomePenalty(penalty);
                                    setIsHomePenaltyDialogOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Sind Sie sicher, dass Sie diese Strafe löschen möchten?")) {
                                      try {
                                        const response = await axios.delete(
                                          `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}/home/penalties/${penalty._id}`,
                                          {
                                            headers: {
                                              Authorization: `Bearer ${jwt}`,
                                              'Content-Type': 'application/json'
                                            }
                                          }
                                        );
                                        if (response.status === 200 || response.status === 204) {
                                          refreshMatchData();
                                        }
                                      } catch (error) {
                                        console.error('Error deleting penalty:', error);
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
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
                      <ul className="divide-y divide-gray-200">
                        {match.away.penalties
                          .sort((a, b) => {
                            // Convert matchTimeStart (format: "mm:ss") to seconds for comparison
                            const timeA = a.matchTimeStart.split(":").map(Number);
                            const timeB = b.matchTimeStart.split(":").map(Number);
                            const secondsA = timeA[0] * 60 + timeA[1];
                            const secondsB = timeB[0] * 60 + timeB[1];
                            return secondsA - secondsB;
                          })
                          .map((penalty, index) => (
                          <li key={`away-penalty-${index}`} className="flex items-center py-3 px-4">
                            <div className="w-20 flex-shrink-0 text-sm text-gray-900">
                              {penalty.matchTimeStart}
                              {penalty.matchTimeEnd && ` - ${penalty.matchTimeEnd}`}
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm text-gray-900">
                                {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.firstName} ${penalty.penaltyPlayer.lastName}` : 'Unbekannt'}
                                {penalty.isGM && ' (GM)'}
                                {penalty.isMP && ' (MP)'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {Object.values(penalty.penaltyCode).join(', ')} - {penalty.penaltyMinutes} Min.
                              </p>
                            </div>
                            {showButtonEvents && (
                              <div className="flex justify-end space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingAwayPenalty(penalty);
                                    setIsAwayPenaltyDialogOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Sind Sie sicher, dass Sie diese Strafe löschen möchten?")) {
                                      try {
                                        const response = await axios.delete(
                                          `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}/away/penalties/${penalty._id}`,
                                          {
                                            headers: {
                                              Authorization: `Bearer ${jwt}`,
                                              'Content-Type': 'application/json'
                                            }
                                          }
                                        );
                                        if (response.status === 200 || response.status === 204) {
                                          refreshMatchData();
                                        }
                                      } catch (error) {
                                        console.error('Error deleting penalty:', error);
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
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
                          const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`, {
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

      {/* Home Team Goal Dialog */}
      <AddGoalDialog
        isOpen={isHomeGoalDialogOpen}
        onClose={() => {
          setIsHomeGoalDialogOpen(false);
          setEditingHomeGoal(null);
        }}
        matchId={match._id}
        teamFlag="home"
        roster={match.home.roster || []}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editGoal={editingHomeGoal}
      />

      {/* Away Team Goal Dialog */}
      <AddGoalDialog
        isOpen={isAwayGoalDialogOpen}
        onClose={() => {
          setIsAwayGoalDialogOpen(false);
          setEditingAwayGoal(null);
        }}
        matchId={match._id}
        teamFlag="away"
        roster={match.away.roster || []}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editGoal={editingAwayGoal}
      />

      {/* Home Team Penalty Dialog */}
      <AddPenaltyDialog
        isOpen={isHomePenaltyDialogOpen}
        onClose={() => {
          setIsHomePenaltyDialogOpen(false);
          setEditingHomePenalty(null);
        }}
        matchId={match._id}
        teamFlag="home"
        roster={match.home.roster || []}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editPenalty={editingHomePenalty}
      />

      {/* Away Team Penalty Dialog */}
      <AddPenaltyDialog
        isOpen={isAwayPenaltyDialogOpen}
        onClose={() => {
          setIsAwayPenaltyDialogOpen(false);
          setEditingAwayPenalty(null);
        }}
        matchId={match._id}
        teamFlag="away"
        roster={match.away.roster || []}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editPenalty={editingAwayPenalty}
      />

      {/* Referees Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schiedsrichter</h3>
        <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-12">
            {match.referee1 ? (
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {match.referee1.firstName.charAt(0)}{match.referee1.lastName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{match.referee1.firstName} {match.referee1.lastName}</p>
                  <p className="text-xs text-gray-500">{match.referee1.clubName && `${match.referee1.clubName}`}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-400">Nicht zugewiesen</p>
                  <p className="text-xs text-gray-500">Schiedsrichter 1</p>
                </div>
              </div>
            )}

            {match.referee2 ? (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {match.referee2.firstName.charAt(0)}{match.referee2.lastName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{match.referee2.firstName} {match.referee2.lastName}</p>
                  <p className="text-xs text-gray-500">{match.referee2.clubName && `${match.referee2.clubName}`}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-400">Nicht zugewiesen</p>
                  <p className="text-xs text-gray-500">Schiedsrichter 2</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout >
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const jwt = (getCookie('jwt', context) || '') as string;

  try {
    const match = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`).then(res => res.json());

    let userRoles: string[] = [];
    let userClubId: string | null = null;

    if (jwt) {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const userData = await userResponse.json();
      userRoles = userData.roles || [];

      // Get user's club ID if available
      if (userData.club && userData.club.clubId) {
        userClubId = userData.club.clubId;
      }
    }

    return {
      props: {
        match,
        jwt,
        userRoles,
        userClubId: userClubId || null,
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};