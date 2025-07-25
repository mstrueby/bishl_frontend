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
                            {player.player.displayFirstName?.charAt(0)}{player.player.displayLastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span>{player.player.displayFirstName} {player.player.displayLastName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.goals || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.assists || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {(player.points || 0)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                    {player.penaltyMinutes || 0}
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

  const RefereeInfo = ({ assigned, referee = {}, position }: { assigned: boolean, referee?: any, position: number }) => (
    <div className="flex items-center px-6 py-4">
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
        {assigned ? `${referee?.firstName?.charAt(0) || ''}${referee?.lastName?.charAt(0) || ''}` : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
      <div className="ml-4">
        <p className={`text-sm font-medium ${assigned ? 'text-gray-900' : 'text-gray-400'}`}>
          {assigned ? `${referee?.firstName || ''} ${referee?.lastName || ''}` : 'Nicht zugewiesen'}
        </p>
        <p className="text-xs text-gray-500">
          {assigned && referee?.clubName ? referee.clubName : `Schiedsrichter ${position}`}
        </p>
      </div>
    </div>
  );

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


      {/* Roster */}
      <div className="mt-14 mb-10">
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
          <div className="w-full md:w-1/2 mt-4 md:mt-0">
            <RosterTable
              teamName={match.away.fullName}
              roster={match.away.roster || []}
              isPublished={match.away.rosterPublished || false}
            />
          </div>
        </div>
      </div>

      {/* All Goals Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tore</h3>
        <div className="bg-white rounded-md shadow-md overflow-hidden border">
          {(() => {
            // Merge goals from both teams with team information
            const allGoals = [
              ...(match.home.scores || []).map(goal => ({
                ...goal,
                teamName: match.home.fullName,
                teamFlag: 'home'
              })),
              ...(match.away.scores || []).map(goal => ({
                ...goal,
                teamName: match.away.fullName,
                teamFlag: 'away'
              }))
            ];

            // Sort by match time (convert mm:ss to seconds for proper sorting)
            const sortedGoals = allGoals.sort((a, b) => {
              const timeA = a.matchTime.split(":").map(Number);
              const timeB = b.matchTime.split(":").map(Number);
              const secondsA = timeA[0] * 60 + timeA[1];
              const secondsB = timeB[0] * 60 + timeB[1];
              return secondsA - secondsB;
            });

            // Calculate cumulative scores
            let homeScore = 0;
            let awayScore = 0;
            const goalsWithScore = sortedGoals.map(goal => {
              if (goal.teamFlag === 'home') {
                homeScore++;
              } else {
                awayScore++;
              }
              return {
                ...goal,
                currentScore: `${homeScore}-${awayScore}`
              };
            });

            return goalsWithScore.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {goalsWithScore.map((goal, index) => (
                  <li key={`${goal.teamFlag}-${index}`} className="flex items-center py-4 px-4 sm:px-6">
                    <div className="flex-shrink-0 w-[32px] h-[32px] sm:w-[32px] sm:h-[32px] mx-auto mr-6">
                      <CldImage
                        src={goal.teamFlag === 'home' ? match.home.logo : match.away.logo}
                        alt={goal.teamFlag === 'home' ? match.home.tinyName : match.away.tinyName}
                        width={32}
                        height={32}
                        gravity="center"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-10 sm:w-16 flex-shrink-0 text-center">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {goal.currentScore}
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        {goal.matchTime}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-center ml-6">
                      {goal.goalPlayer && goal.goalPlayer.imageUrl && goal.goalPlayer.imageVisible ? (
                        <CldImage
                          src={goal.goalPlayer.imageUrl}
                          alt={`${goal.goalPlayer.displayFirstName} ${goal.goalPlayer.displayLastName}`}
                          width={32}
                          height={32}
                          gravity="center"
                          radius="max"
                          className="w-8 h-8 object-cover mr-3"
                        />
                      ) : goal.goalPlayer ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-500">
                            {goal.goalPlayer.displayFirstName?.charAt(0)}{goal.goalPlayer.displayLastName?.charAt(0)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center">
                        
                        <p className="text-sm font-medium text-gray-900">
                          {goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.displayFirstName} ${goal.goalPlayer.displayLastName}` : 'Unbekannt'}
                        </p>
                      </div>
                      {goal.assistPlayer ? (
                        <p className="text-xs text-gray-500 mt-1">
                          #{goal.assistPlayer.jerseyNumber} {goal.assistPlayer.displayFirstName} {goal.assistPlayer.displayLastName}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Keine Vorlage</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                Keine Tore vorhanden
              </div>
            );
          })()}
        </div>
      </div>

      {/* All Penalties Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Strafen</h3>
        <div className="bg-white rounded-md shadow-md overflow-hidden border">
          {(() => {
            // Merge penalties from both teams with team information
            const allPenalties = [
              ...(match.home.penalties || []).map(penalty => ({
                ...penalty,
                teamName: match.home.fullName,
                teamFlag: 'home'
              })),
              ...(match.away.penalties || []).map(penalty => ({
                ...penalty,
                teamName: match.away.fullName,
                teamFlag: 'away'
              }))
            ];

            // Sort by match time start (convert mm:ss to seconds for proper sorting)
            const sortedPenalties = allPenalties.sort((a, b) => {
              const timeA = a.matchTimeStart.split(":").map(Number);
              const timeB = b.matchTimeStart.split(":").map(Number);
              const secondsA = timeA[0] * 60 + timeA[1];
              const secondsB = timeB[0] * 60 + timeB[1];
              return secondsA - secondsB;
            });

            return sortedPenalties.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {sortedPenalties.map((penalty, index) => (
                  <li key={`${penalty.teamFlag}-${index}`} className="flex items-center py-4 px-4 sm:px-6">
                    <div className="flex-shrink-0 w-[32px] h-[32px] sm:w-[32px] sm:h-[32px] mx-auto mr-6">
                      <CldImage
                        src={penalty.teamFlag === 'home' ? match.home.logo : match.away.logo}
                        alt={penalty.teamFlag === 'home' ? match.home.tinyName : match.away.tinyName}
                        width={32}
                        height={32}
                        gravity="center"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-10 sm:w-16 flex-shrink-0 text-sm font-medium text-gray-900 text-center">
                      <div>{penalty.matchTimeStart}</div>
                      {/**
                      {penalty.matchTimeEnd && (
                        <div className="text-xs text-gray-500">{penalty.matchTimeEnd}</div>
                      )}
                      */}
                    </div>
                    <div className="flex-grow ml-6">
                      <p className="text-sm font-medium text-gray-900">
                        {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.displayFirstName} ${penalty.penaltyPlayer.displayLastName}` : 'Unbekannt'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {penalty.isGM && 'GM · '}
                        {penalty.isMP && 'MP · '}
                        {penalty.penaltyMinutes} Min. · {penalty.penaltyCode.key} - {penalty.penaltyCode.value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                Keine Strafen vorhanden
              </div>
            );
          })()}
        </div>
      </div>

      {/* Referees Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schiedsrichter</h3>
        <div className="flex flex-col sm:flex-row sm:items-center bg-white rounded-md shadow-md border divide-y divide-gray-200">
          {match.referee1 ? (
            <RefereeInfo assigned={true} referee={match.referee1} position={1} />
          ) : (
            <RefereeInfo assigned={false} position={1} />
          )}
          {match.referee2 ? (
            <RefereeInfo assigned={true} referee={match.referee2} position={2} />
          ) : (
            <RefereeInfo assigned={false} position={2} />
          )}
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