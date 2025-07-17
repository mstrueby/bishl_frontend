import { useState, useEffect, useCallback, Fragment } from 'react';
import useAuth from '../../../../hooks/useAuth';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Dialog, Transition } from '@headlessui/react';
import { Match, RosterPlayer, PenaltiesBase, ScoresBase } from '../../../../types/MatchValues';
import { MatchdayOwner } from '../../../../types/TournamentValues'
import Layout from '../../../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];
import { CalendarIcon, MapPinIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs, allFinishTypes } from '../../../../tools/consts';
import { classNames, calculateMatchButtonPermissions } from '../../../../tools/utils';
import MatchStatusBadge from '../../../../components/ui/MatchStatusBadge';
import MatchHeader from '../../../../components/ui/MatchHeader';
import FinishTypeSelect from '../../../../components/admin/ui/FinishTypeSelect';
import MatchStatus from '../../../../components/admin/ui/MatchStatus';
import GoalDialog from '../../../../components/ui/GoalDialog';
import PenaltyDialog from '../../../../components/ui/PenaltyDialog';
import RosterList from '../../../../components/ui/RosterList';
import ScoreList from '../../../../components/ui/ScoreList';
import PenaltyList from '../../../../components/ui/PenaltyList'

interface MatchDetailsProps {
  match: Match;
  matchdayOwner: MatchdayOwner;
  jwt?: string;
  userRoles?: string[];
  userClubId?: string | null;
}

interface EditMatchData {
  venue: { venueId: string, name: string; alias: string };
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

export default function MatchDetails({ match: initialMatch, matchdayOwner, jwt, userRoles, userClubId }: MatchDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
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
  const [homePlayerStats, setHomePlayerStats] = useState<{ [playerId: string]: number }>({});
  const [awayPlayerStats, setAwayPlayerStats] = useState<{ [playerId: string]: number }>({});
  {/** 
  const [editData, setEditData] = useState<EditMatchData>({
    venue: match.venue,
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
    matchStatus: match.matchStatus,
    finishType: match.finishType,
    homeScore: match.home.stats.goalsFor,
    awayScore: match.away.stats.goalsFor
  });
  */}
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Get active tab from query parameter, default to 'roster'
  const getActiveTabFromQuery = () => {
    const { tab } = router.query;
    const validTabs = ['roster', 'goals', 'penalties'];
    return validTabs.includes(tab as string) ? (tab as string) : 'roster';
  };

  // Update active tab when query parameter changes
  useEffect(() => {
    const newActiveTab = getActiveTabFromQuery();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [router.query.tab, activeTab]);

  // Fetch player stats for called players
  useEffect(() => {
    const fetchPlayerStats = async (roster: RosterPlayer[], team: { name: string }) => {
      if (!jwt) return {};

      const calledPlayers = roster.filter(player => player.called);
      if (calledPlayers.length === 0) return {};

      const statsPromises = calledPlayers.map(async (player) => {
        try {
          const response = await axios.get(`${BASE_URL}/players/${player.player.playerId}`, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            }
          });

          const playerData = response.data;
          if (playerData.stats && Array.isArray(playerData.stats)) {
            // Find stats that match the current match context
            const matchingStats = playerData.stats.find((stat: any) =>
              stat.season?.alias === match.season.alias &&
              stat.tournament?.alias === match.tournament.alias &&
              stat.team?.name === team.name
            );

            return {
              playerId: player.player.playerId,
              calledMatches: matchingStats?.calledMatches || 0
            };
          }

          return {
            playerId: player.player.playerId,
            calledMatches: 0
          };
        } catch (error) {
          console.error(`Error fetching stats for player ${player.player.playerId}:`, error);
          return {
            playerId: player.player.playerId,
            calledMatches: 0
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      return statsResults.reduce((acc, stat) => {
        acc[stat.playerId] = stat.calledMatches;
        return acc;
      }, {} as { [playerId: string]: number });
    };

    const fetchAllPlayerStats = async () => {
      // Fetch home team stats
      if (match.home.roster && match.home.roster.some(player => player.called)) {
        const homeStats = await fetchPlayerStats(match.home.roster, { name: match.home.name });
        setHomePlayerStats(homeStats);
      }

      // Fetch away team stats
      if (match.away.roster && match.away.roster.some(player => player.called)) {
        const awayStats = await fetchPlayerStats(match.away.roster, { name: match.away.name });
        setAwayPlayerStats(awayStats);
      }
    };

    fetchAllPlayerStats();
  }, [match, jwt]);

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

  const permissions = calculateMatchButtonPermissions(user, match, matchdayOwner, true);


  return (
    <Layout>
      <a
        href={`/tournaments/${match.tournament.alias}`}
        aria-label="Back to tournament"
        className="flex items-center"
      >
        <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
        <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
          Alle Spiele der {tournamentConfigs[match.tournament.alias]?.tinyName}
        </span>
      </a>

      <MatchHeader
        match={match}
        isRefreshing={isRefreshing}
        onRefresh={refreshMatchData}
      />

      {/* Team Buttons in Separate Row */}
      <div className="flex justify-between mt-6 mb-4">
        {/* Home Team Buttons */}
        <div className="w-1/3 flex justify-center">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {permissions.showButtonEvents && match.matchStatus.key === "INPROGRESS" && (
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
        <div className="w-1/3 flex justify-center items-center space-x-2">
          {permissions.showButtonStatus && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000 && (
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

              <button
                onClick={() => setIsStatusDialogOpen(true)}
                className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ergebnis
              </button>
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
            {permissions.showButtonEvents && match.matchStatus.key === "INPROGRESS" && (
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
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, tab: tab.id }
                }, undefined, { shallow: true });
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={classNames(
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'w-1/3 border-b-2 px-1 py-4 text-center text-md font-medium',
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
                <div className="flex flex-col md:flex-row md:space-x-8">
                  {/* Home team roster */}
                  <div className="w-full md:w-1/2 mb-6 md:mb-0">
                    <RosterList
                      teamName={match.home.fullName}
                      roster={sortedHomeRoster}
                      isPublished={match.home.rosterPublished || false}
                      showEditButton={permissions.showButtonRosterHome}
                      editUrl={`/matches/${match._id}/home/roster`}
                      sortRoster={sortRoster}
                      playerStats={homePlayerStats}
                    />
                  </div>
                  {/* Away team roster */}
                  <div className="w-full md:w-1/2">
                    <RosterList
                      teamName={match.away.fullName}
                      roster={sortedAwayRoster}
                      isPublished={match.away.rosterPublished || false}
                      showEditButton={permissions.showButtonRosterAway}
                      editUrl={`/matches/${match._id}/away/roster`}
                      sortRoster={sortRoster}
                      playerStats={awayPlayerStats}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="py-4">
            {/* Container for side-by-side or stacked goals */}
            <div className="flex flex-col md:flex-row md:space-x-8">
              {/* Home team goals */}
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <ScoreList
                  jwt={jwt || ''}
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
              {/* Away team goals */}
              <div className="w-full md:w-1/2">
                <ScoreList
                  jwt={jwt || ''}
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
          </div>
        )}

        {activeTab === 'penalties' && (
          <div className="py-4">
            {/* Container for side-by-side or stacked penalties */}
            <div className="flex flex-col md:flex-row md:space-x-8">
              {/* Home team penalties */}
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <PenaltyList
                  jwt={jwt || ''}
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

              {/* Away team penalties */}
              <div className="w-full md:w-1/2">
                <PenaltyList
                  jwt={jwt || ''}
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
          </div>
        )}
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
                <Dialog.Panel className="w-full max-w-md p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                  <Dialog.Title
                    as="h3"
                    className="text-lg text-center font-bold leading-6 text-gray-900 mb-4">
                    Spiel beenden
                  </Dialog.Title>

                  <div className="mt-4">
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
      <GoalDialog
        isOpen={isHomeGoalDialogOpen}
        onClose={() => {
          setIsHomeGoalDialogOpen(false);
          setEditingHomeGoal(null);
        }}
        matchId={match._id}
        teamFlag="home"
        roster={[...(match.home.roster || [])].sort((a, b) => a.player.jerseyNumber - b.player.jerseyNumber)}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editGoal={editingHomeGoal}
      />

      {/* Away Team Goal Dialog */}
      <GoalDialog
        isOpen={isAwayGoalDialogOpen}
        onClose={() => {
          setIsAwayGoalDialogOpen(false);
          setEditingAwayGoal(null);
        }}
        matchId={match._id}
        teamFlag="away"
        roster={[...(match.away.roster || [])].sort((a, b) => a.player.jerseyNumber - b.player.jerseyNumber)}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editGoal={editingAwayGoal}
      />

      {/* Home Team Penalty Dialog */}
      <PenaltyDialog
        isOpen={isHomePenaltyDialogOpen}
        onClose={() => {
          setIsHomePenaltyDialogOpen(false);
          setEditingHomePenalty(null);
        }}
        matchId={match._id}
        teamFlag="home"
        roster={[...(match.home.roster || [])].sort((a, b) => a.player.jerseyNumber - b.player.jerseyNumber)}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editPenalty={editingHomePenalty}
      />

      {/* Away Team Penalty Dialog */}
      <PenaltyDialog
        isOpen={isAwayPenaltyDialogOpen}
        onClose={() => {
          setIsAwayPenaltyDialogOpen(false);
          setEditingAwayPenalty(null);
        }}
        matchId={match._id}
        teamFlag="away"
        roster={[...(match.away.roster || [])].sort((a, b) => a.player.jerseyNumber - b.player.jerseyNumber)}
        jwt={jwt || ''}
        onSuccess={refreshMatchData}
        editPenalty={editingAwayPenalty}
      />

      {/* Status Dialog */}
      <MatchStatus
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        match={match}
        jwt={jwt || ''}
        onSuccess={(updatedMatch) => {
          setMatch(updatedMatch);
        }}
        onMatchUpdate={async (updatedMatch) => {
          setMatch(updatedMatch);
        }}
      />

      {/* Referees Section */}
      <div className="py-6 mt-4 border-t border-gray-200">
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
    const match: Match = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`).then(res => res.json());
    //console.log("match", match)
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

    const matchday = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${match.tournament.alias}/seasons/${match.season.alias}/rounds/${match.round.alias}/matchdays/${match.matchday.alias}/`).then(res => res.json())

    return {
      props: {
        match,
        matchdayOwner: matchday.owner,
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