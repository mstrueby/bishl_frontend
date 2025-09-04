import React, { Fragment, useState, useEffect, useRef } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../../../../../components/Layout';
import { getCookie } from 'cookies-next';
import { Match, RosterPlayer, Team } from '../../../../../types/MatchValues';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import { PlayerValues, Assignment, AssignmentTeam } from '../../../../../types/PlayerValues';
import { Listbox, Transition, Switch } from '@headlessui/react';
import { ChevronLeftIcon, TrashIcon, PencilIcon, CheckIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/solid';
import { classNames, calculateMatchButtonPermissions } from '../../../../../tools/utils';
import PlayerSelect from '../../../../../components/ui/PlayerSelect';
import RosterList from '../../../../../components/ui/RosterList';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RosterPDF from '../../../../../components/pdf/RosterPDF';
import { CldImage } from 'next-cloudinary';
import MatchStatusBadge from '../../../../../components/ui/MatchStatusBadge';
import MatchHeader from '../../../../../components/ui/MatchHeader';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { tournamentConfigs } from '../../../../../tools/consts';



let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface AvailablePlayer {
  _id: string,
  firstName: string,
  lastName: string,
  displayFirstName: string,
  displayLastName: string,
  position: string,
  fullFaceReq: boolean,
  source: string,
  imageUrl: string,
  imageVisible: boolean,
  passNo: string,
  jerseyNo: number | undefined,
  called: boolean,
  originalTeam: string | null;
  active?: boolean;
}

interface RosterPageProps {
  jwt: string;
  match: Match;
  matchTeam: Team;
  club: ClubValues;
  team: TeamValues;
  roster: RosterPlayer[];
  rosterPublished: boolean;
  teamFlag: string;
  availablePlayers: AvailablePlayer[];
  allAvailablePlayers: AvailablePlayer[];
  matches: Match[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, teamFlag } = context.params as { id: string; teamFlag: string };
  const jwt = getCookie('jwt', context);
  if (!jwt || !id || !teamFlag)
    return { notFound: true };

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    // console.log("user:", user)

    // Fetch match data
    const matchResponse = await axios.get(`${BASE_URL}/matches/${id}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    //console.log("match", matchResponse.data)
    const match: Match = await matchResponse.data;

    // Determine which team's roster to fetch
    const matchTeam: Team = teamFlag === 'home' ? match.home : match.away;

    // get club object
    const clubResponse = await axios.get(`${BASE_URL}/clubs/${matchTeam.clubAlias}`);
    const club: ClubValues = await clubResponse.data;

    // get team object
    const teamResponse = await axios.get(`${BASE_URL}/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`);
    const team: TeamValues = await teamResponse.data;
    //console.log(team)
    const teamAgeGroup = team.ageGroup;

    // Fetch available players from the current team
    const teamPlayerResponse = await axios.get(
      `${BASE_URL}/players/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        sortby: 'lastName',
        // No active param - we'll fetch all players and filter on the client
        all: true
      }
    }
    );
    const teamPlayers: PlayerValues[] = Array.isArray(teamPlayerResponse.data.results) ? teamPlayerResponse.data.results : [];
    let allTeamsPlayers: PlayerValues[] = [];
    let additionalPlayers: PlayerValues[] = [];
    let additionalTeamsIds: string[] = [];

    // Handle team partnerships if they exist
    if (team.teamPartnership && Array.isArray(team.teamPartnership) && team.teamPartnership.length > 0) {
      console.log(`Found ${team.teamPartnership.length} team partnerships`);

      // Fetch players from each partnership team
      for (const partnership of team.teamPartnership) {
        if (partnership.clubAlias && partnership.teamAlias) {
          console.log(`Getting players from partnership: ${partnership.clubAlias}/${partnership.teamAlias}`);

          try {
            // Get the team details first to add to additionalTeamsIds
            const partnerTeamResponse = await axios.get(
              `${BASE_URL}/clubs/${partnership.clubAlias}/teams/${partnership.teamAlias}`
            );
            const partnerTeam = partnerTeamResponse.data;
            if (partnerTeam && partnerTeam._id) {
              additionalTeamsIds.push(partnerTeam._id);
            }

            // Get the players from the partnership team
            const playersResponse = await axios.get(
              `${BASE_URL}/players/clubs/${partnership.clubAlias}/teams/${partnership.teamAlias}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
              params: {
                sortby: 'lastName',
                // No active param - we'll fetch all players and filter on the client
                all: true
              }
            });

            const partnershipPlayers = Array.isArray(playersResponse.data.results)
              ? playersResponse.data.results
              : [];

            additionalPlayers = [...additionalPlayers, ...partnershipPlayers];
          } catch (error) {
            console.error(`Error fetching players from partnership ${partnership.clubAlias}/${partnership.teamAlias}:`, error);
          }
        }
      }
    }

    {/**
    // Define age group progression map
    const ageGroupMergeMap: { [key: string]: string } = {
      'Junioren': 'Jugend',
      'Jugend': 'Schüler',
      'Schüler': 'Bambini',
      'Bambini': 'Mini'
    };

    // Check if the current team's age group has younger teams to merge from
    const youngerAgeGroup = ageGroupMergeMap[teamAgeGroup];

    if (youngerAgeGroup) {
      // Find teams from the younger age group
      const youngerTeams: TeamValues[] = club.teams.filter((team: TeamValues) =>
        team.ageGroup === youngerAgeGroup && team.active
      );

      if (youngerTeams.length > 0) {
        console.log(`Found ${youngerTeams.length} ${youngerAgeGroup} teams to merge with ${teamAgeGroup}`);
        const youngerTeamIds = youngerTeams.map((team: TeamValues) => team._id);
        additionalTeamsIds = [...additionalTeamsIds, ...youngerTeamIds];

        // Fetch players from each younger team
        for (const youngerTeam of youngerTeams) {
          console.log(`Getting players from ${youngerAgeGroup} team: ${youngerTeam.name}`);

          try {
            const playersResponse = await axios.get(
              `${BASE_URL}/players/clubs/${matchTeam.clubAlias}/teams/${youngerTeam.alias}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
              params: {
                sortby: 'lastName',
                active: 'true'
              }
            }
            );

            const youngerTeamPlayers = Array.isArray(playersResponse.data.results)
              ? playersResponse.data.results
              : [];

            additionalPlayers = [...additionalPlayers, ...youngerTeamPlayers];
          } catch (error) {
            console.error(`Error fetching players from ${youngerTeam.name}:`, error);
          }
        }
      }
    }
    */}


    // Combine the players from the current team and all additional players
    allTeamsPlayers = [...teamPlayers, ...additionalPlayers];
    console.log(`Total players after merging: ${allTeamsPlayers.length}`);

    // Debug log to check what's coming back
    console.log("Additional team IDs:", additionalTeamsIds);
    console.log("Team players count:", allTeamsPlayers.length);
    //console.log("All teams players:", allTeamsPlayers);
    // loop through assignedTeams.clubs[].teams in availablePlayers to find team with teamId=matchTeam.teamId. get passNo and jerseyNo
    const availablePlayers = allTeamsPlayers.map((teamPlayer: PlayerValues) => {
      // Check if assignedTeams exists and is an array
      if (!teamPlayer.assignedTeams || !Array.isArray(teamPlayer.assignedTeams)) {
        console.log("Player missing assignedTeams:", teamPlayer._id);
        return null;
      }

      // Find the team assignment that matches the target team ID or matches the Bambini team alias
      //console.log("teamPlayer name:", teamPlayer.firstName, teamPlayer.lastName)
      //console.log("teamPlayer.assignedTeams:", JSON.stringify(teamPlayer.assignedTeams, null, 2));
      const assignedTeam = teamPlayer.assignedTeams
        .flatMap((assignment: Assignment) => assignment.teams || [])
        .find((team: AssignmentTeam) => {
          if (!team) return false;
          if (team.teamId === matchTeam.teamId) return true;
          return additionalTeamsIds.some(id => id === team.teamId);
        });
      // Determine if this is a player from a merged team
      const isFromYoungerTeam = additionalTeamsIds.some(id => assignedTeam && assignedTeam.teamId === id);

      // Find original team name if the player is from another team
      let originalTeamName = null;
      if (isFromYoungerTeam && assignedTeam) {
        // Find the team from club.teams that matches the assignedTeam.teamId
        const originalTeam = club.teams.find(t => t._id === assignedTeam.teamId);
        if (originalTeam) {
          originalTeamName = originalTeam.name;
        }
      }

      return assignedTeam ? {
        _id: teamPlayer._id,
        firstName: teamPlayer.firstName,
        lastName: teamPlayer.lastName,
        displayFirstName: teamPlayer.displayFirstName,
        displayLastName: teamPlayer.displayLastName,
        position: teamPlayer.position || 'Skater',
        fullFaceReq: teamPlayer.fullFaceReq,
        source: teamPlayer.source,
        imageUrl: teamPlayer.imageUrl,
        imageVisible: teamPlayer.imageVisible,
        passNo: assignedTeam.passNo,
        jerseyNo: assignedTeam.jerseyNo,
        called: false,
        originalTeam: originalTeamName, // Add the original team name if available
        active: assignedTeam.active // Include active status from team assignment
      } : null;
    }).filter((player: AvailablePlayer | null) => player !== null);

    // Sort available players by lastName, then by firstName
    const sortedAvailablePlayers = availablePlayers.sort((a, b) => {
      // First sort by lastName
      const lastNameComparison = ((a?.lastName ?? "") as string).localeCompare((b?.lastName ?? "") as string);
      // If lastName is the same, sort by firstName
      return lastNameComparison !== 0 ? lastNameComparison :
        ((a?.firstName ?? "") as string).localeCompare((b?.firstName ?? "") as string);
    });

    // Keep both the full list and a filtered list of available players
    const rosterPlayerIds = (matchTeam.roster || []).map(rp => rp.player.playerId);
    const filteredAvailablePlayers = sortedAvailablePlayers.filter(player =>
      !rosterPlayerIds.includes(player?._id ?? '')
    );

    console.log("All available players:", availablePlayers.length);
    console.log("Filtered available players for roster:", filteredAvailablePlayers.length);

    // Fetch other matches of the same matchday
    const matchesResponse = await axios.get(`${BASE_URL}/matches`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        matchday: match.matchday.alias,
        round: match.round.alias,
        season: match.season.alias,
        tournament: match.tournament.alias,
        club: matchTeam.clubAlias,
        team: matchTeam.teamAlias
      },
    });
    const matches: Match[] = matchesResponse.data;



    return {
      props: {
        jwt,
        match,
        matchTeam,
        club,
        team,
        roster: matchTeam.roster || [],
        rosterPublished: matchTeam.rosterPublished || false,
        teamFlag,
        availablePlayers: filteredAvailablePlayers || [],
        allAvailablePlayers: availablePlayers || [],
        matches: matches || [],
      }
    };

  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      notFound: true
    };
  }
};



// Player position options
const playerPositions = [
  { key: 'F', value: 'Feldspieler' },
  { key: 'C', value: 'Captain' },
  { key: 'A', value: 'Assistant' },
  { key: 'G', value: 'Goalie' },
];

const RosterPage = ({ jwt, match, matchTeam, club, team, roster, rosterPublished: initialRosterPublished, teamFlag, availablePlayers = [], allAvailablePlayers = [], matches }: RosterPageProps) => {
  const router = useRouter();
  const { user } = useAuth();

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL LOGIC
  // Calculate back link once during initialization
  const getBackLink = () => {
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    // Check referrer if it exists
    if (referrer && referrer.includes(`/tournaments/${match.tournament.alias}`)) {
      return `/tournaments/${match.tournament.alias}`;
    }
    // Check if there's a query parameter indicating source
    else if (router.query.from === 'tournament') {
      return `/tournaments/${match.tournament.alias}`;
    }
    else if (router.query.from === 'calendar') {
      return `/calendar`;
    }
    else if (router.query.from === 'matchcenter') {
      return `/matches/${match._id}/matchcenter`;
    }
    // Default to match sheet
    else {
      return `/matches/${match._id}`;
    }
  };

  const [backLink] = useState(() => getBackLink());
  const playerSelectRef = useRef<any>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const jerseyNumberRef = useRef<HTMLInputElement>(null);
  const positionSelectRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayer | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number>(0);
  const [playerPosition, setPlayerPosition] = useState(playerPositions[0]); // Default to 'F' (Feldspieler)
  const [availablePlayersList, setAvailablePlayersList] = useState<AvailablePlayer[]>(availablePlayers || []);
  const [allAvailablePlayersList, setAllAvailablePlayersList] = useState<AvailablePlayer[]>(allAvailablePlayers || []);
  const [rosterPublished, setRosterPublished] = useState<boolean>(initialRosterPublished);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<RosterPlayer | null>(null);
  const [editPlayerNumber, setEditPlayerNumber] = useState<number>(0);
  const [editPlayerPosition, setEditPlayerPosition] = useState(playerPositions[0]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCallUpModalOpen, setIsCallUpModalOpen] = useState(false);
  const [includeInactivePlayers, setIncludeInactivePlayers] = useState(false);
  const [callUpTeams, setCallUpTeams] = useState<TeamValues[]>([]);
  const [selectedCallUpTeam, setSelectedCallUpTeam] = useState<TeamValues | null>(null);
  const [callUpPlayers, setCallUpPlayers] = useState<AvailablePlayer[]>([]);
  const [selectedCallUpPlayer, setSelectedCallUpPlayer] = useState<AvailablePlayer | null>(null);
  const [callUpModalError, setCallUpModalError] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<{ [playerId: string]: number }>({});

  // Calculate permissions for this user and match
  const permissions = calculateMatchButtonPermissions(user, match, undefined, backLink.includes('matchcenter'));
  const hasRosterPermission = teamFlag === 'home' ? permissions.showButtonRosterHome : permissions.showButtonRosterAway;

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMesssage = () => {
    setError(null);
  }

  const handleCloseModalError = () => {
    setModalError(null);
  };

  // Fetch teams from the same club with the same age group
  useEffect(() => {
    if (isCallUpModalOpen && club && team) {
      // Filter teams from the same club with the same age group and a lower team number, but not the current team
      const fetchTeams = async () => {
        try {
          const teamsResponse = await axios.get(`${BASE_URL}/clubs/${club.alias}/teams/`, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            }
          });
          const filteredTeams = teamsResponse.data.filter((t: TeamValues) =>
            t.ageGroup === team.ageGroup && t._id !== team._id && t.active && t.teamNumber > team.teamNumber
          );
          setCallUpTeams(filteredTeams);
        } catch (error) {
          console.error('Error fetching teams:', error);
          setCallUpModalError('Fehler beim Laden der Teams');
        }
      };

      fetchTeams();
    }
  }, [isCallUpModalOpen, club, team, jwt]);

  // Sort roster by position order: C, A, G, F, then by jersey number
  const sortRoster = React.useMemo(() => {
    return (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
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
  }, []);

  const minSkaterCount = team.ageGroup === 'HERREN' || team.ageGroup === 'DAMEN' ? 4 : 8;

  // Check if all requirements are met for publishing the roster
  const isRosterValid = () => {
    const hasZeroJerseyNumber = rosterList.some(player => player.player.jerseyNumber === 0);
    const hasCaptain = rosterList.some(player => player.playerPosition.key === 'C');
    const hasAssistant = rosterList.some(player => player.playerPosition.key === 'A');
    const hasGoalie = rosterList.some(player => player.playerPosition.key === 'G');
    const skaterCount = rosterList.filter(player => player.playerPosition.key != 'G').length;
    const hasMinSkater = skaterCount >= minSkaterCount;
    const calledPlayersCount = rosterList.filter(player => player.called).length;
    const hasMaxCalledPlayers = calledPlayersCount <= 5;
    const hasDoubleJerseyNumbers = rosterList.some((player, index) =>
      rosterList.findIndex(p => p.player.jerseyNumber === player.player.jerseyNumber) !== index
    );

    return !hasZeroJerseyNumber && hasCaptain && hasAssistant && hasGoalie && hasMinSkater && hasMaxCalledPlayers && !hasDoubleJerseyNumbers;
  };

  // Fetch players when a team is selected
  const [rosterList, setRosterList] = useState<RosterPlayer[]>(sortRoster(roster || []));

  // Memoized PDF download link to avoid recreating on every render
  const pdfDownloadLink = React.useMemo(() => (
    <PDFDownloadLink
      document={
        <RosterPDF
          teamName={team.fullName}
          matchDate={new Date(match.startDate).toLocaleDateString()}
          venue={match.venue.name}
          roster={sortRoster(rosterList)}
          teamLogo={team.logoUrl}
        />
      }
      fileName={`roster-${team.alias}-${new Date().toISOString().split('T')[0]}.pdf`}
      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    >
      {({ loading }) => (
        <>
          <span className="block sm:hidden">PDF</span>
          <span className="hidden sm:block">{loading ? 'Generiere PDF...' : 'PDF herunterladen'}</span>
        </>
      )}
    </PDFDownloadLink>
  ), [team.fullName, team.alias, team.logoUrl, match.startDate, match.venue.name, sortRoster, rosterList]);

  // Update available players list when the toggle changes
  useEffect(() => {
    if (includeInactivePlayers) {
      // Use all players when including inactive
      const rosterPlayerIds = rosterList.map(rp => rp.player.playerId);
      const filteredPlayers = allAvailablePlayersList.filter(player =>
        !rosterPlayerIds.includes(player._id)
      );
      setAvailablePlayersList(filteredPlayers);
    } else {
      // Only show active players (filter out inactive from allAvailablePlayersList)
      const rosterPlayerIds = rosterList.map(rp => rp.player.playerId);
      const filteredPlayers = allAvailablePlayersList.filter(player =>
        !rosterPlayerIds.includes(player._id) &&
        (player.active !== false) // Only include players where active is not false
      );
      setAvailablePlayersList(filteredPlayers);
    }
  }, [includeInactivePlayers, rosterList, allAvailablePlayersList, sortRoster]);
  
  // Auto-set published to true if match is finished
  const isMatchFinished = match.matchStatus.key === 'FINISHED';
  useEffect(() => {
    if (isMatchFinished) {
      setRosterPublished(true);
    }
  }, [isMatchFinished]);

  // Fetch player stats for called players
  useEffect(() => {
    const fetchPlayerStats = async () => {
      const calledPlayers = rosterList.filter(player => player.called);
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
              stat.team?.name === matchTeam.name
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
      const statsMap = statsResults.reduce((acc, stat) => {
        acc[stat.playerId] = stat.calledMatches;
        return acc;
      }, {} as { [playerId: string]: number });

      setPlayerStats(statsMap);
    };

    if (rosterList.some(player => player.called)) {
      fetchPlayerStats();
    }
  }, [rosterList, jwt, match.season.alias, match.tournament.alias, matchTeam.name]);

  // Fetch players when a team is selected
  useEffect(() => {
    if (selectedCallUpTeam) {
      const fetchPlayers = async () => {
        try {
          const playersResponse = await axios.get(
            `${BASE_URL}/players/clubs/${club.alias}/teams/${selectedCallUpTeam.alias}`, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
            params: {
              sortby: 'lastName',
              // If includeInactivePlayers is true, don't specify active param to get all players
              // Otherwise, only get active players
              ...(includeInactivePlayers ? { all: true } : { active: 'true' })
            }
          });

          const players = playersResponse.data.results || [];

          // Format the players to match the AvailablePlayer interface
          const formattedPlayers = players.map((player: PlayerValues) => {
            // Find the team assignment for the selected team
            const assignedTeam = player.assignedTeams
              ?.flatMap((assignment: Assignment) => assignment.teams || [])
              .find((team: AssignmentTeam) => team && team.teamId === selectedCallUpTeam._id);

            return {
              _id: player._id,
              firstName: player.firstName,
              lastName: player.lastName,
              displayFirstName: player.displayFirstName,
              displayLastName: player.displayLastName,
              position: player.position || 'Skater',
              fullFaceReq: player.fullFaceReq,
              source: player.source,
              imageUrl: player.imageUrl,
              imageVisible: player.imageVisible,
              passNo: assignedTeam?.passNo || '',
              jerseyNo: assignedTeam?.jerseyNo,
              called: true,
              active: assignedTeam?.active // Track active status
            };
          }).filter((player: AvailablePlayer | null) => player !== null);

          // Filter out players that are already in the roster
          const rosterPlayerIds = rosterList.map(rp => rp.player.playerId);
          const filteredPlayers = formattedPlayers.filter((player: AvailablePlayer) =>
            !rosterPlayerIds.includes(player._id)
          );

          setCallUpPlayers(filteredPlayers);
        } catch (error) {
          console.error('Error fetching players:', error);
          setCallUpModalError('Fehler beim Laden der Spieler');
          setCallUpPlayers([]);
        }
      };

      fetchPlayers();
    } else {
      setCallUpPlayers([]);
      setSelectedCallUpPlayer(null);
    }
  }, [selectedCallUpTeam, club, jwt, rosterList, includeInactivePlayers]);

  // Check if user has permission to access roster - after all hooks
  if (!hasRosterPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nicht berechtigt</h2>
            <p className="text-gray-500 mb-4">Sie haben keine Berechtigung, die Aufstellung für diese Mannschaft zu bearbeiten.</p>
            <Link href={`/matches/${match._id}`}>
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Zurück zum Spiel
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle adding the selected call-up player to the available players list
  const handleConfirmCallUp = () => {
    if (!selectedCallUpPlayer) {
      setCallUpModalError('Bitte wähle einen Spieler aus');
      return;
    }

    // Check if the player is already in the available players list
    if (availablePlayersList.some(p => p._id === selectedCallUpPlayer._id)) {
      setCallUpModalError('Dieser Spieler ist bereits in der Liste verfügbar');
      return;
    }

    // Make sure the called attribute is set to true
    const playerWithCalled = {
      ...selectedCallUpPlayer,
      called: true
    };

    // Add the player to the available players list and sort alphabetically
    setAvailablePlayersList(prev => {
      const newList = [...prev, playerWithCalled];
      return newList.sort((a, b) => {
        // First sort by lastName
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        // If lastName is the same, sort by firstName
        return lastNameComparison !== 0 ? lastNameComparison :
          a.firstName.localeCompare(b.firstName);
      });
    });

    // Auto-select the newly called up player
    setSelectedPlayer(playerWithCalled);

    // Set the jersey number if the called up player has one
    if (selectedCallUpPlayer.jerseyNo) {
      setPlayerNumber(selectedCallUpPlayer.jerseyNo);
    }

    // Close the modal and reset selections
    setIsCallUpModalOpen(false);
    setSelectedCallUpTeam(null);
    setSelectedCallUpPlayer(null);
    setCallUpModalError(null);

    // Focus jersey number input after modal closes
    setTimeout(() => {
      if (jerseyNumberRef.current) {
        jerseyNumberRef.current.focus();
      }
    }, 100);

    // Optional: Show a success message
    setSuccessMessage(`Spieler ${selectedCallUpPlayer.firstName} ${selectedCallUpPlayer.lastName} wurde hochgemeldet und steht zur Verfügung.`);
  };

  const handleEditPlayer = (player: RosterPlayer) => {
    setEditingPlayer(player);
    setEditPlayerNumber(player.player.jerseyNumber);
    // Find the position in playerPositions that matches the player's position
    const position = playerPositions.find(pos => pos.key === player.playerPosition.key);
    setEditPlayerPosition(position || playerPositions[0]); // Default to 'F' if not found
    setModalError(null); // Clear any modal errors when opening the dialog
    setError(null)
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPlayer) return;

    // Check if trying to change to Captain when another player is already Captain
    if (editPlayerPosition.key === 'C' &&
      rosterList.some(player =>
        player.playerPosition.key === 'C' &&
        player.player.playerId !== editingPlayer.player.playerId
      )) {
      setModalError('Es kann nur ein Spieler als Captain (C) gekennzeichnet werden');
      return;
    }

    // Check if trying to change to Assistant when another player is already Assistant
    if (editPlayerPosition.key === 'A' &&
      rosterList.some(player =>
        player.playerPosition.key === 'A' &&
        player.player.playerId !== editingPlayer.player.playerId
      )) {
      setModalError('Es kann nur ein Spieler als Assistant (A) gekennzeichnet werden');
      return;
    }

    // Check if trying to add more than 2 Goalies
    if (editPlayerPosition.key === 'G' && editingPlayer.playerPosition.key !== 'G') {
      const goalieCount = rosterList.filter(player => player.playerPosition.key === 'G').length;
      if (goalieCount >= 2) {
        setModalError('Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden');
        return;
      }
    }

    // Check if trying to add more than 14 Feldspieler
    if (editPlayerPosition.key === 'F' && editingPlayer.playerPosition.key !== 'F') {
      const feldspielerCount = rosterList.filter(player => player.playerPosition.key === 'F').length;
      if (feldspielerCount >= 14) {
        setModalError('Es können maximal 14 Feldspieler (F) eingetragen werden');
        return;
      }
    }

    const updatedRoster = rosterList.map(player => {
      if (player.player.playerId === editingPlayer.player.playerId) {
        return {
          ...player,
          player: {
            ...player.player,
            jerseyNumber: editPlayerNumber
          },
          playerPosition: editPlayerPosition
        };
      }
      return player;
    });

    setRosterList(sortRoster(updatedRoster));
    setIsEditModalOpen(false);
    setEditingPlayer(null);
    setModalError(null);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingPlayer(null);
    setModalError(null);
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (!match) {
    return <Layout><div>Match not found</div></Layout>;
  }

  // Filter out players that are already in the roster
  //const availablePlayers = allPlayers.filter(player =>
  //    !rosterList.some(rp => rp.id === player._id)
  //);

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      setError('Wähle einen Spieler aus');
      return;
    }

    // Check if trying to add a Captain when one already exists
    if (playerPosition.key === 'C' && rosterList.some(player => player.playerPosition.key === 'C')) {
      setError('Es kann nur ein Spieler als Captain (C) gekennzeichnet werden');
      return;
    }

    // Check if trying to add an Assistant when one already exists
    if (playerPosition.key === 'A' && rosterList.some(player => player.playerPosition.key === 'A')) {
      setError('Es kann nur ein Spieler als Assistant (A) gekennzeichnet werden');
      return;
    }

    // Check if trying to add more than 2 Goalies
    if (playerPosition.key === 'G') {
      const goalieCount = rosterList.filter(player => player.playerPosition.key === 'G').length;
      if (goalieCount >= 2) {
        setError('Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden');
        return;
      }
    }

    // Check if trying to add more than 14 Feldspieler
    if (playerPosition.key === 'F') {
      const feldspielerCount = rosterList.filter(player => player.playerPosition.key === 'F').length;
      if (feldspielerCount >= 14) {
        setError('Es können maximal 14 Feldspieler (F) eingetragen werden');
        return;
      }
    }

    // Set playerNumber to the jerseyNo from playerDetails if it exists and playerNumber is not set
    if (!playerNumber) {
      // Find the player in playerDetails
      const playerDetail = availablePlayers.find(player => player._id === selectedPlayer._id);
      if (playerDetail && playerDetail.jerseyNo) {
        setPlayerNumber(playerDetail.jerseyNo);
      }
    }

    setLoading(true);

    try {
      // Here you would normally make an API call to save the player to the roster
      // For now, we'll just update the local state
      const newPlayer: RosterPlayer = {
        player: {
          playerId: selectedPlayer._id,
          firstName: selectedPlayer.firstName,
          lastName: selectedPlayer.lastName,
          jerseyNumber: playerNumber,
        },
        playerPosition: {
          key: playerPosition.key,
          value: playerPosition.value,
        },
        passNumber: selectedPlayer.passNo,
        called: selectedPlayer.called || false,
        goals: 0,
        assists: 0,
        points: 0,
        penaltyMinutes: 0
      };

      // Add player to roster
      const updatedRoster = [...rosterList, newPlayer];

      // Sort roster using the sortRoster function
      const sortedRoster = sortRoster(updatedRoster);
      console.log("updatedRoster", updatedRoster);
      console.log("sortedRoster", sortedRoster);
      setRosterList(sortedRoster);

      // Remove the selected player from the available players list
      if (selectedPlayer) {
        setAvailablePlayersList(prevList =>
          prevList.filter(player => player._id !== selectedPlayer._id)
        );
      }

      // Reset form
      setSelectedPlayer(null);
      setPlayerNumber(0);
      setPlayerPosition(playerPositions[0]); // Reset to 'F' (Feldspieler)
      setError('');

      // Keep focus on the "Hinzufügen" button after adding player
      setTimeout(() => {
        if (addButtonRef.current) {
          addButtonRef.current.focus();
        }
      }, 100);

      // Here you would make the actual API call to update the roster
      /*
      await axios.post(`${BASE_URL}/matches/${match._id}/roster/${teamFlag}`, {
        playerId: selectedPlayer._id,
        playerNumber: playerNumber
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      */

    } catch (error) {
      console.error('Error adding player to roster:', error);
      setError('Failed to add player to roster');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoster = async () => {
    // For finished matches, automatically set roster to published
    if (match.matchStatus.key === 'FINISHED') {
      setRosterPublished(true);
    }

    // Check if all requirements are met before saving
    if (!isRosterValid() && (rosterPublished || match.matchStatus.key === 'FINISHED')) {
      setError('Die Aufstellung entspricht nicht allen Anforderungen. Bitte überprüfen Sie alle Punkte in der Checkliste.');
      return;
    }

    setSavingRoster(true);
    setError('');
    let cntAdditionalMatches = 0;

    // Prepare the data to be sent
    const rosterData = {
      roster: rosterList,
      published: rosterPublished || match.matchStatus.key === 'FINISHED' // Always publish if match is finished
    };

    console.log('Roster data to be saved:', rosterData)

    try {
      // Make the API call to save the roster for the main match
      const rosterResponse = await axios.put(`${BASE_URL}/matches/${match._id}/${teamFlag}/roster/`, rosterData.roster, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Roster successfully saved:', rosterResponse.data);

      try {
        // Update roster published status for the main match
        const publishResponse = await axios.patch(`${BASE_URL}/matches/${match._id}`, {
          [teamFlag]: {
            rosterPublished: rosterData.published
          }
        }, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          }
        });
        console.log('Roster published status updated:', rosterData.published);
      } catch (error) {
        // Ignore 304 responses and continue
        if (axios.isAxiosError(error) && error.response?.status !== 304) {
          throw error;
        }
        console.log('Roster published status not changed (304)');
      }

      // Save roster for selected additional matches
      console.log('Selected matches:', selectedMatches);
      for (const m of matches.filter(m => selectedMatches.includes(m._id))) {
        try {
          // Determine if the team is home or away in this match
          const matchTeamFlag: 'home' | 'away' = m.home.teamId === matchTeam.teamId ? 'home' : 'away';

          // Save roster for this match
          const rosterResponse = await axios.put(
            `${BASE_URL}/matches/${m._id}/${matchTeamFlag}/roster/`,
            rosterData.roster,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`Roster successfully saved for match ${m._id} as ${matchTeamFlag} team:`, rosterResponse.data);
          cntAdditionalMatches += 1;

          try {
            // Update roster published status with correct team flag
            await axios.patch(
              `${BASE_URL}/matches/${m._id}`,
              {
                [matchTeamFlag]: {
                  rosterPublished: rosterData.published
                }
              },
              {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                }
              }
            );
            console.log(`Roster published status updated for match ${m._id} as ${matchTeamFlag} team`);
          } catch (error) {
            // Ignore 304 responses and continue
            if (axios.isAxiosError(error) && error.response?.status !== 304) {
              throw error;
            }
            console.log(`Roster published status not changed (304) for match ${m._id}`);
          }

        } catch (error) {
          console.error('Error saving roster for additional match:', error);
          setError(`Fehler beim Speichern der Aufstellung für ${m.home.shortName} vs ${m.away.shortName}`);
        }
      }

      // Show success message or redirect
      setError(null);
      // You could add a success message here if needed
    } catch (error) {
      // Ignore 304 Not Modified errors as they're not actual errors
      if (axios.isAxiosError(error) && error.response?.status === 304) {
        console.log('Match not changed (304 Not Modified), continuing normally');
      } else {
        console.error('Error saving roster/match:', error);
        setError('Aufstellung konnte nicht gespeichert werden.');
      }
    } finally {
      setSavingRoster(false);
      // Set success message if no error occurred
      if (!error) {
        let successMsg = '';
        if (cntAdditionalMatches === 0) {
          successMsg = 'Aufstellung erfolgreich gespeichert.';
        }
        else {
          successMsg += `Aufstellungen erfolgreich gespeichert`;
          if (cntAdditionalMatches === 1) {
            successMsg += ` (inklusive für ein weiteres Spiel).`;
          } else {
            successMsg += ` (inklusive für ${cntAdditionalMatches} weitere Spiele).`;
          }
        }
        setSuccessMessage(successMsg);
      }
      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <Link href={backLink}>
        <a className="flex items-center" aria-label="Back">
          <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
          <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
            {backLink.includes('/matchcenter') ? 'Match Center' : backLink.includes('/calendar') ? 'Kalender' : tournamentConfigs[match.tournament.alias]?.name}
          </span>
        </a>
      </Link>

      <MatchHeader
        match={match}
        isRefreshing={false}
        onRefresh={() => { }}
      />
      <div className="mt-12">
        <SectionHeader title="Mannschaftsaufstellung" description={`${team?.fullName} / ${team?.name}`} />
      </div>

      <div className="sm:px-3 pb-2">
        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
        {error && <ErrorMessage error={error} onClose={handleCloseErrorMesssage} />}
      </div>

      {/* Main Form */}
      <div className="bg-white shadow-md rounded-lg border">

        {/* Add Player Form */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* Player Selection */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCallUpModalOpen(true)}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Hochmelden
                </button>
              </div>
              <div className="flex flex-row items-center justify-between sm:justify-end">
                <span className="text-sm text-gray-700 sm:mr-4">Inaktive Spieler anzeigen</span>
                <Switch
                  checked={includeInactivePlayers}
                  onChange={setIncludeInactivePlayers}
                  className={`${includeInactivePlayers ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                >
                  <span
                    aria-hidden="true"
                    className={`${includeInactivePlayers ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </Switch>
              </div>
              <PlayerSelect
                ref={playerSelectRef}
                name="player-select"
                tabIndex={1}
                selectedPlayer={selectedPlayer ? {
                  player: {
                    playerId: selectedPlayer._id,
                    firstName: selectedPlayer.firstName,
                    lastName: selectedPlayer.lastName,
                    jerseyNumber: selectedPlayer.jerseyNo || 0
                  },
                  playerPosition: { key: 'F', value: 'Feldspieler' },
                  passNumber: selectedPlayer.passNo,
                  called: selectedPlayer.called,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  penaltyMinutes: 0
                } : null}
                onChange={(selectedRosterPlayer) => {
                  if (selectedRosterPlayer) {
                    const availablePlayer = availablePlayersList.find(p => p._id === selectedRosterPlayer.player.playerId);
                    if (availablePlayer) {
                      setSelectedPlayer(availablePlayer);
                      if (availablePlayer.jerseyNo) {
                        setPlayerNumber(availablePlayer.jerseyNo);
                      }
                      // Focus the jersey number input after player selection
                      setTimeout(() => {
                        if (jerseyNumberRef.current) {
                          jerseyNumberRef.current.focus();
                          jerseyNumberRef.current.select(); // Also select the text for easy replacement
                        }
                      }, 100);
                    }
                  } else {
                    setSelectedPlayer(null);
                  }
                }}
                roster={availablePlayersList.map(player => ({
                  player: {
                    playerId: player._id,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    jerseyNumber: player.jerseyNo || 0
                  },
                  playerPosition: { key: 'F', value: 'Feldspieler' },
                  passNumber: player.passNo,
                  called: player.called,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  penaltyMinutes: 0
                }))}
                placeholder="Spieler auswählen"
              />
            </div>
            {/* Jersey Number and Position */}
            <div className="flex flex-row justify-between items-center mb-1">
              <div>
                <label htmlFor="player-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Nr.
                </label>
                <input
                  ref={jerseyNumberRef}
                  type="text"
                  id="player-number"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(parseInt(e.target.value) || 0)}
                  className="block w-16 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="##"
                  tabIndex={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      // Focus the position select dropdown when Enter or Tab is pressed
                      if (positionSelectRef.current) {
                        positionSelectRef.current.focus();
                      }
                    }
                  }}
                />
              </div>
              <div className="w-full ml-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <Listbox value={playerPosition} onChange={(position) => {
                  setPlayerPosition(position);
                  // Focus the Add button after position selection
                  setTimeout(() => {
                    if (addButtonRef.current) {
                      addButtonRef.current.focus();
                    }
                  }, 100);
                }}>
                  {({ open }) => (
                    <>
                      <div className="relative">
                        <Listbox.Button
                          ref={positionSelectRef}
                          tabIndex={3}
                          onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                            if (e.key === 'Enter' && !open) {
                              e.preventDefault();
                              // Focus the Add button when Enter is pressed and dropdown is closed
                              if (addButtonRef.current) {
                                addButtonRef.current.focus();
                              }
                            }
                            // Handle letter key presses for position selection
                            const key = e.key.toUpperCase();
                            if (['C', 'A', 'G', 'F'].includes(key)) {
                              e.preventDefault();
                              const position = playerPositions.find(pos => pos.key === key);
                              if (position) {
                                setPlayerPosition(position);
                                // Focus the Add button after keyboard selection
                                setTimeout(() => {
                                  if (addButtonRef.current) {
                                    addButtonRef.current.focus();
                                  }
                                }, 100);
                              }
                            }
                          }}
                          className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                          <span className="block truncate">
                            {playerPosition.key} - {playerPosition.value}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>

                        <Transition
                          show={open}
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {playerPositions.map((position) => (
                              <Listbox.Option
                                key={position.key}
                                className={({ active }) =>
                                  classNames(
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                    'relative cursor-default select-none py-2 pl-3 pr-9'
                                  )
                                }
                                value={position}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={classNames(
                                      selected ? 'font-semibold' : 'font-normal',
                                      'block truncate'
                                    )}>
                                      {position.key} - {position.value}
                                    </span>

                                    {selected ? (
                                      <span
                                        className={classNames(
                                          active ? 'text-white' : 'text-indigo-600',
                                          'absolute inset-y-0 right-0 flex items-center pr-4'
                                        )}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </>
                  )}
                </Listbox>
              </div>
            </div>
          </div>
          {/** Button */}
          <div className="mt-4 flex justify-end">
            <button
              ref={addButtonRef}
              type="button"
              onClick={handleAddPlayer}
              disabled={loading}
              tabIndex={4}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  // Focus PlayerSelect after TAB key press
                  setTimeout(() => {
                    if (playerSelectRef.current && playerSelectRef.current.focus) {
                      playerSelectRef.current.focus();
                    }
                  }, 100);
                }
              }}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Roster List - Editable View */}
        <div className="">
          <ul className="divide-y divide-gray-200">
            {rosterList.length > 0 ? (
              rosterList.map((player) => (
                <li key={player.player.playerId} className={`px-6 py-4 ${player.player.jerseyNumber === 0 ? 'bg-yellow-50' : ''}`}>
                  <div className="flex items-center">
                    <div className={`min-w-8 md:min-w-12 text-sm font-semibold ${player.player.jerseyNumber === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {player.player.jerseyNumber}
                    </div>
                    <div className="min-w-8 md:min-w-12 text-sm font-medium text-gray-500">
                      {player.playerPosition.key}
                    </div>
                    <div className="flex-1 text-sm text-gray-900">
                      {player.player.lastName}, {player.player.firstName}
                    </div>
                    <div className="flex-1 hidden sm:block flex-1 text-xs">
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        {player.passNumber}
                      </span>
                    </div>
                    <div className="flex-1 text-sm text-gray-500 ml-6 md:ml-0">
                      {player.called ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset
                         ${playerStats[player.player.playerId] >= 0 && playerStats[player.player.playerId] <= 3
                            ? 'bg-green-50 text-green-800 ring-green-600/20'
                            : playerStats[player.player.playerId] === 4
                            ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                            : 'bg-red-50 text-red-800 ring-red-600/20'}`}>
                          <ArrowUpIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                          <span className="hidden sm:block">Hochgemeldet</span>
                          {/** Feasture -Switch */}
                          {/**
                          {playerStats[player.player.playerId] !== undefined && (
                            <span className="ml-1 sm:ml-2 inline-flex items-center gap-x-2 mr-1">
                              <svg viewBox="0 0 2 2" className="hidden sm:block h-0.5 w-0.5 fill-current">
                                <circle r={1} cx={1} cy={1} />
                              </svg>
                              <span className="text-xs font-medium">
                                {playerStats[player.player.playerId]}
                              </span>
                            </span>
                          )}
                          */}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex space-x-2 sm:ml-4">
                      <button
                        type="button"
                        onClick={() => handleEditPlayer(player)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {(() => {
                        // Check if player has any events (goals or penalties)
                        const hasScored = match[teamFlag as 'home' | 'away'].scores?.some(score =>
                          score.goalPlayer.playerId === player.player.playerId ||
                          (score.assistPlayer && score.assistPlayer.playerId === player.player.playerId)
                        );
                        const hasPenalty = match[teamFlag as 'home' | 'away'].penalties?.some(penalty =>
                          penalty.penaltyPlayer.playerId === player.player.playerId
                        );
                        const hasEvents = hasScored || hasPenalty;

                        if (hasEvents) {
                          // Show disabled button with tooltip
                          return (
                            <button
                              type="button"
                              disabled
                              title="Spieler kann nicht entfernt werden, da er bereits ein Tor erzielt, einen Assist gegeben oder eine Strafe erhalten hat."
                              className="text-gray-400 cursor-not-allowed"
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          );
                        } else {
                          // Show active delete button
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                // Find the player in the complete list of all players
                                const playerToAddBack = allAvailablePlayers.find(p => p._id === player.player.playerId);

                                // Remove from roster
                                const updatedRoster = rosterList.filter(p => p.player.playerId !== player.player.playerId);
                                setRosterList(updatedRoster);

                                // Add back to available players list if found and not already there
                                if (playerToAddBack && !availablePlayersList.some(p => p._id === playerToAddBack._id)) {
                                  setAvailablePlayersList(prevList => {
                                    // Add the player back and sort the list by lastName, then firstName
                                    const newList = [...prevList, playerToAddBack];
                                    return newList.sort((a, b) => {
                                      // First sort by lastName
                                      const lastNameComparison = a.lastName.localeCompare(b.lastName);
                                      // If lastName is the same, sort by firstName
                                      return lastNameComparison !== 0 ? lastNameComparison :
                                        a.firstName.localeCompare(b.firstName);
                                    });
                                  });
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-center text-gray-500">
                Keine Spieler in der Aufstellung
              </li>
            )}
          </ul>
        </div>

        {/* Roster Completeness Check */}
        <div className="p-6 border-t bg-gray-50">
          <div className="space-y-3">

            {/* Captain check indicator */}
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'C') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {rosterList.some(player => player.playerPosition.key === 'C') ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some(player => player.playerPosition.key === 'C')
                  ? 'Captain (C) wurde festgelegt'
                  : 'Es wurde noch kein Captain (C) festgelegt'}
              </span>
            </div>

            {/* Assistant check indicator */}
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'A') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {rosterList.some(player => player.playerPosition.key === 'A') ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some(player => player.playerPosition.key === 'A')
                  ? 'Assistant (A) wurde festgelegt'
                  : 'Es wurde noch kein Assistant (A) festgelegt'}
              </span>
            </div>

            {/* Goalie check indicator */}
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'G') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {rosterList.some(player => player.playerPosition.key === 'G') ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some(player => player.playerPosition.key === 'G')
                  ? 'Mindestens ein Goalie (G) wurde festgelegt'
                  : 'Es wurde noch kein Goalie (G) festgelegt'}
              </span>
            </div>

            {/* Feldspieler check indicator */}
            <div className="flex items-center mt-4">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.filter(player => player.playerPosition.key != 'G').length >= minSkaterCount ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {rosterList.filter(player => player.playerPosition.key != 'G').length >= minSkaterCount ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.filter(player => player.playerPosition.key != 'G').length >= minSkaterCount
                  ? `Mindestens ${minSkaterCount} Feldspieler wurden festgelegt`
                  : `Es müssen mindestens ${minSkaterCount} Feldspieler festgelegt werden`}
              </span>
            </div>

            {/** Jersey No check indicator */}
            <div className="flex items-center mt-4">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.player.jerseyNumber === 0) ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {rosterList.some(player => player.player.jerseyNumber === 0) ? (
                  <ExclamationCircleIcon className="h-6 w-6" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some(player => player.player.jerseyNumber === 0) ? 'Es fehlen noch Rückennummern' : 'Alle Spieler müssen Rückennummern haben'}
              </span>
            </div>

            {/* Double Jersey No check indicator */}
            <div className="flex items-center mt-4">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player, index) => rosterList.findIndex(p => p.player.jerseyNumber === player.player.jerseyNumber) !== index) ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {rosterList.some((player, index) => rosterList.findIndex(p => p.player.jerseyNumber === player.player.jerseyNumber) !== index) ? (
                  <ExclamationCircleIcon className="h-6 w-6" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some((player, index) => rosterList.findIndex(p => p.player.jerseyNumber === player.player.jerseyNumber) !== index)
                  ? 'Doppelte Rückennummern vorhanden'
                  : 'Keine doppelten Rückennummern'}
              </span>
            </div>


            {/* Called players check indicator */}
            <div className="flex items-center mt-4">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.filter(player => player.called).length <= 5 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {rosterList.filter(player => player.called).length <= 5 ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.filter(player => player.called).length <= 5
                  ? `Hochgemeldete Spieler: ${rosterList.filter(player => player.called).length} von 5`
                  : `Zu viele hochgemeldete Spieler: ${rosterList.filter(player => player.called).length} von max. 5`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Publish Roster Checkbox */}
      <div className="flex items-center justify-between mt-8 bg-white shadow rounded-md border p-6">
        <div className="flex items-center">
          <div className="relative inline-flex items-center">
            <div className="flex items-center h-6">
              {/* Check if all required conditions are met using isRosterValid function */}
              {(() => {
                // If match is finished, always publish roster and disable checkbox
                const isFinished = match.matchStatus.key === 'FINISHED';
                const allChecksPass = isRosterValid();

                // If checks don't pass and not a finished match, always set rosterPublished to false
                if (!allChecksPass && !isFinished) {
                  // Ensure rosterPublished is false if checks don't pass
                  if (rosterPublished) {
                    setRosterPublished(false);
                  }
                }

                // If match is finished, always set rosterPublished to true
                if (isFinished && !rosterPublished) {
                  setRosterPublished(true);
                }

                return (
                  <input
                    id="rosterPublished"
                    type="checkbox"
                    className={`h-4 w-4 rounded border-gray-300 ${allChecksPass || isFinished ? 'text-indigo-600' : 'text-gray-400 bg-gray-100'} focus:ring-indigo-600`}
                    checked={rosterPublished || isFinished}
                    onChange={(e) => {
                      if (allChecksPass && !isFinished) {
                        setRosterPublished(e.target.checked);
                      }
                    }}
                    disabled={!allChecksPass || isFinished}
                  />
                );
              })()}
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="rosterPublished" className={`font-medium ${isRosterValid() ? 'text-gray-900' : 'text-gray-400'}`}>Veröffentlichen</label>
              <p className="text-gray-500">
                {!isRosterValid() ? "Behebe zuerst alle Fehler in der Aufstellung" : "Austellung öffentlich sichtbar machen"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Other Matchday Matches */}
      {matches.filter(m => {
        if (m._id === match._id) return false;
        const matchDate = new Date(match.startDate);
        const otherMatchDate = new Date(m.startDate);
        return matchDate.toDateString() === otherMatchDate.toDateString();
      }).length > 0 && (
          <>
            <h2 className="mt-8 mb-3 text-lg font-medium text-gray-900">Weitere Spiele am gleichen Spieltag</h2>
            <div className="bg-white shadow rounded-md border mb-6">
              {match.matchday && match.round && match.season && match.tournament && (
                <ul className="divide-y divide-gray-200">
                  {matches
                    .filter(m => {
                      // Exclude current match
                      if (m._id === match._id) return false;

                      // Only show matches on the same date
                      const matchDate = new Date(match.startDate);
                      const otherMatchDate = new Date(m.startDate);
                      return matchDate.toDateString() === otherMatchDate.toDateString();
                    })
                    .map((m) => (
                      <li key={m._id} className="px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <input
                              id={`match-${m._id}`}
                              type="checkbox"
                              value={m._id}
                              disabled={m.matchStatus.key !== 'SCHEDULED'}
                              className={`w-4 h-4 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${m.matchStatus.key === 'SCHEDULED'
                                ? 'text-blue-600 bg-gray-100'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                }`}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMatches(prev => [...prev, m._id]);
                                } else {
                                  setSelectedMatches(prev => prev.filter(id => id !== m._id));
                                }
                              }}
                            />
                            <div className="flex-shrink-0 h-8 w-8">
                              <CldImage
                                src={m[m.home.teamId === matchTeam.teamId ? 'away' : 'home'].logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                                alt="Team logo"
                                width={32}
                                height={32}
                                gravity="center"
                                className="object-contain"

                              />
                            </div>
                            <div className="text-sm text-gray-900">
                              {m[m.home.teamId === matchTeam.teamId ? 'away' : 'home'].shortName}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {m.matchStatus.key === 'SCHEDULED' ? (
                              new Date(m.startDate).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) + ' Uhr'
                            ) : (
                              <MatchStatusBadge
                                statusKey={m.matchStatus.key}
                                finishTypeKey={m.finishType.key}
                                statusValue={m.matchStatus.value}
                                finishTypeValue={m.finishType.value}
                              />
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        )}

      {/* Close, Save buttons */}
      <div className="flex space-x-3 mt-6 justify-end">

        {pdfDownloadLink}

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Schließen
        </button>
        <button
          type="button"
          onClick={handleSaveRoster}
          disabled={loading || savingRoster || (match.matchStatus.key === 'FINISHED' && !isRosterValid())}
          className={`w-24 inline-flex justify-center items-center rounded-md border border-transparent ${match.matchStatus.key === 'FINISHED' && !isRosterValid()
            ? 'bg-indigo-300 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500'
            } py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          {savingRoster ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
            </svg>
          ) : (
            'Speichern'
          )}
        </button>
      </div>

      {/* Edit Player Modal */}
      {isEditModalOpen && editingPlayer && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Spieler bearbeiten: {editingPlayer.player.lastName}, {editingPlayer.player.firstName}
            </h3>

            {/* Jersey Number */}
            <div className="mb-4">
              <label htmlFor="edit-player-number" className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <input
                type="text"
                id="edit-player-number"
                value={editPlayerNumber}
                onChange={(e) => setEditPlayerNumber(parseInt(e.target.value) || 0)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="##"
              />
            </div>

            {/* Player Position */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Listbox value={editPlayerPosition} onChange={setEditPlayerPosition}>
                {({ open }) => (
                  <>
                    <div className="relative">
                      <Listbox.Button
                        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                          // Handle letter key presses for position selection
                          const key = e.key.toUpperCase();
                          if (['C', 'A', 'G', 'F'].includes(key)) {
                            e.preventDefault();
                            const position = playerPositions.find(pos => pos.key === key);
                            if (position) {
                              setEditPlayerPosition(position);
                            }
                          }
                        }}
                        className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        <span className="block truncate">
                          {editPlayerPosition.key} - {editPlayerPosition.value}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {playerPositions.map((position) => (
                            <Listbox.Option
                              key={position.key}
                              className={({ active }) =>
                                classNames(
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-3 pr-9'
                                )
                              }
                              value={position}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={classNames(
                                    selected ? 'font-semibold' : 'font-normal',
                                    'block truncate'
                                  )}>
                                    {position.key} - {position.value}
                                  </span>

                                  {selected ? (
                                    <span
                                      className={classNames(
                                        active ? 'text-white' : 'text-indigo-600',
                                        'absolute inset-y-0 right-0 flex items-center pr-4'
                                      )}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </>
                )}
              </Listbox>
            </div>

            {modalError && <ErrorMessage error={modalError} onClose={handleCloseModalError} />}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call-Up Player Modal */}
      {isCallUpModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Spieler aus anderer Mannschaft hinzufügen
            </h3>

            {callUpModalError && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{callUpModalError}</h3>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setCallUpModalError(null)}
                        className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outlinenone focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Include Inactive Players Toggle */}
            <div className="flex flex-row items-center justify-between sm:justify-end">
              <span className="text-sm text-gray-700 sm:mr-4">Inaktive Spieler anzeigen</span>
              <Switch
                checked={includeInactivePlayers}
                onChange={setIncludeInactivePlayers}
                className={`${includeInactivePlayers ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
              >
                <span
                  aria-hidden="true"
                  className={`${includeInactivePlayers ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>

            {/* Team Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team
              </label>
              <Listbox value={selectedCallUpTeam} onChange={setSelectedCallUpTeam}>
                {({ open }) => (
                  <>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        <span className={`block truncate ${selectedCallUpTeam ? '' : 'text-gray-400'}`}>
                          {selectedCallUpTeam ? selectedCallUpTeam.name : 'Mannschaft auswählen'}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={React.Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {callUpTeams.length > 0 ? (
                            callUpTeams.map((teamItem) => (
                              <Listbox.Option
                                key={teamItem._id}
                                className={({ active }) =>
                                  classNames(
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                    'relative cursor-default select-none py-2 pl-3 pr-9'
                                  )
                                }
                                value={teamItem}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={classNames(
                                      selected ? 'font-semibold' : 'font-normal',
                                      'block truncate'
                                    )}>
                                      {teamItem.name}
                                    </span>

                                    {selected ? (
                                      <span
                                        className={classNames(
                                          active ? 'text-white' : 'text-indigo-600',
                                          'absolute inset-y-0 right-0 flex items-center pr-4'
                                        )}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))
                          ) : (
                            <div className="py-2 px-3 text-gray-500 italic">
                              Keine Mannschaften verfügbar
                            </div>
                          )}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </>
                )}
              </Listbox>
            </div>

            {/* Player Selection - Call Up */}
            <div className="mb-6">
              <PlayerSelect
                ref={playerSelectRef}
                name="call-up-player-select"
                selectedPlayer={selectedCallUpPlayer ? {
                  player: {
                    playerId: selectedCallUpPlayer._id,
                    firstName: selectedCallUpPlayer.firstName,
                    lastName: selectedCallUpPlayer.lastName,
                    jerseyNumber: selectedCallUpPlayer.jerseyNo || 0
                  },
                  playerPosition: { key: 'F', value: 'Feldspieler' },
                  passNumber: selectedCallUpPlayer.passNo,
                  called: selectedCallUpPlayer.called,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  penaltyMinutes: 0
                } : null}
                onChange={(selectedRosterPlayer) => {
                  if (selectedRosterPlayer) {
                    const availablePlayer = callUpPlayers.find(p => p._id === selectedRosterPlayer.player.playerId);
                    if (availablePlayer) {
                      setSelectedCallUpPlayer(availablePlayer);
                      // Focus the "Hinzufügen" button after player selection
                      setTimeout(() => {
                        const hinzufuegenButton = document.querySelector('[data-callup-add-button]') as HTMLButtonElement;
                        if (hinzufuegenButton) {
                          hinzufuegenButton.focus();
                        }
                      }, 100);
                    }
                  } else {
                    setSelectedCallUpPlayer(null);
                  }
                }}
                roster={callUpPlayers.map(player => ({
                  player: {
                    playerId: player._id,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    jerseyNumber: player.jerseyNo || 0
                  },
                  playerPosition: { key: 'F', value: 'Feldspieler' },
                  passNumber: player.passNo,
                  called: player.called,
                  goals: 0,
                  assists: 0,
                  points: 0,
                  penaltyMinutes: 0
                }))}
                label="Spieler"
                placeholder={selectedCallUpTeam ? 'Spieler auswählen' : 'Bitte zuerst eine Mannschaft auswählen'}
                required={false}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCallUpModalOpen(false);
                  setSelectedCallUpTeam(null);
                  setSelectedCallUpPlayer(null);
                  setCallUpModalError(null);
                  // Focus jersey number input after modal closes
                  setTimeout(() => {
                    if (jerseyNumberRef.current) {
                      jerseyNumberRef.current.focus();
                    }
                  }, 100);
                }}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmCallUp}
                disabled={!selectedCallUpPlayer}
                data-callup-add-button
                className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${selectedCallUpPlayer
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'bg-indigo-300 cursor-not-allowed'
                  }`}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default RosterPage;