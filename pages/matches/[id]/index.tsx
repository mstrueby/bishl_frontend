import { useState, useEffect, useCallback, Fragment } from 'react';
import useAuth from '../../../hooks/useAuth';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Dialog, Transition } from '@headlessui/react';
import { Match, RosterPlayer, PenaltiesBase, ScoresBase } from '../../../types/MatchValues';
import { MatchdayOwner } from '../../../types/TournamentValues'
import Layout from '../../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { CalendarIcon, MapPinIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs, allFinishTypes } from '../../../tools/consts';
import { classNames } from '../../../tools/utils';
import MatchStatusBadge from '../../../components/ui/MatchStatusBadge';
import FinishTypeSelect from '../../../components/admin/ui/FinishTypeSelect';
import MatchHeader from '../../../components/ui/MatchHeader';

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

interface RosterTableProps {
  teamName: string;
  roster: RosterPlayer[];
  isPublished: boolean;
}

const tabs = [
  { id: 'roster', name: 'Aufstellung' },
  { id: 'goals', name: 'Tore' },
  { id: 'penalties', name: 'Strafen' },
]

// Reusable RosterTable component
const RosterTable: React.FC<RosterTableProps> = ({ teamName, roster, isPublished }) => {
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

  const sortedRoster = sortRoster(roster || []);

  return (
    <div className="w-full">
      <div className="text-center mb-3">
        <h4 className="text-md font-semibold">{teamName}</h4>
      </div>
      <div className="overflow-hidden bg-white shadow-md rounded-md border">
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
                  Name
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  V
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SM
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRoster.map((player) => (
                <tr key={player.player.playerId}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-8 text-center">
                    {player.player.jerseyNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-4">
                    {player.playerPosition.key}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    <span>{player.player.displayFirstname} {player.player.lastName}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.player.stats?.goals || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.player.stats?.assists || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {(player.player.stats?.goals || 0) + (player.player.stats?.assists || 0)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.player.stats?.penaltyMinutes || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {!isPublished ? 'Aufstellung noch nicht veröffentlicht' : 'Keine Aufstellung verfügbar'}
          </div>
        )}
      </div>
    </div>
  );
};

export default function MatchDetails({ match: initialMatch, matchdayOwner, jwt, userRoles, userClubId }: MatchDetailsProps) {
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


      {/* Tab content */}
      <div className="py-6">
        {activeTab === 'roster' && (
          <div className="py-4">
            <div className="flex flex-col md:flex-row md:space-x-4">
              {/* Home team roster */}
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <RosterTable
                  teamName={match.home.fullName}
                  roster={match.home.roster || []}
                  isPublished={match.home.rosterPublished || false}
                />
              </div>

              {/* Away team roster */}
              <div className="w-full md:w-1/2">
                <RosterTable
                  teamName={match.away.fullName}
                  roster={match.away.roster || []}
                  isPublished={match.away.rosterPublished || false}
                />
              </div>
            </div>
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