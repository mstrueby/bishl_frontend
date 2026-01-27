import React, { Fragment, useState, useEffect, useRef } from "react";
import useAuth from "../../../../../hooks/useAuth";
import usePermissions from "../../../../../hooks/usePermissions";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../../../../components/Layout";
import {
  MatchValues,
  RosterPlayer,
  Team,
} from "../../../../../types/MatchValues";
import { Source, LicenseType, LicenseStatus } from "../../../../../types/PlayerValues";
import apiClient from "../../../../../lib/apiClient";
import { getErrorMessage } from "../../../../../lib/errorHandler";
import { ClubValues, TeamValues } from "../../../../../types/ClubValues";
import {
  PlayerValues,
  Assignment,
  AssignmentTeam,
} from "../../../../../types/PlayerValues";
import { Listbox, Transition, Switch, Dialog } from "@headlessui/react";
import {
  ChevronLeftIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  ListBulletIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { ChevronUpDownIcon, PlusIcon } from "@heroicons/react/24/solid";
import {
  classNames,
  calculateMatchButtonPermissions,
} from "../../../../../tools/utils";
import RosterPlayerSelect from "../../../../../components/ui/RosterPlayerSelect";
import RosterList from "../../../../../components/ui/RosterList";
import SuccessMessage from "../../../../../components/ui/SuccessMessage";
import ErrorMessage from "../../../../../components/ui/ErrorMessage";
import LoadingState from "../../../../../components/ui/LoadingState";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RosterPDF from "../../../../../components/pdf/RosterPDF";
import { CldImage } from "next-cloudinary";
import MatchStatusBadge from "../../../../../components/ui/MatchStatusBadge";
import MatchHeader from "../../../../../components/ui/MatchHeader";
import SectionHeader from "../../../../../components/admin/SectionHeader";
import { tournamentConfigs } from "../../../../../tools/consts";
import { UserRole } from "../../../../../lib/auth";

interface AvailablePlayer {
  _id: string;
  firstName: string;
  lastName: string;
  displayFirstName: string;
  displayLastName: string;
  position: string;
  fullFaceReq: boolean;
  source: string;
  imageUrl: string;
  imageVisible: boolean;
  passNo: string;
  jerseyNo: number | undefined;
  called: boolean;
  originalTeam: string | null;
  active?: boolean;
  licenceType?: string;
  status?: string;
  licenseType?: string;
}

// Extended player type for the new interactive table
// Merges AvailablePlayer with roster selection state
interface AvailablePlayerWithRoster extends AvailablePlayer {
  selected: boolean;
  rosterJerseyNo: number;
  rosterPosition: "C" | "A" | "G" | "F" | null;
  statusDiff: boolean;
  assignedStatus?: string;
}

// Player position options
const playerPositions = [
  { key: "F", value: "Feldspieler" },
  { key: "C", value: "Captain" },
  { key: "A", value: "Assistant" },
  { key: "G", value: "Goalie" },
];

const RosterPage = () => {
  const router = useRouter();
  const { id, teamFlag } = router.query as { id: string; teamFlag: string };
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL LOGIC
  const [pageLoading, setPageLoading] = useState(true);
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [matchTeam, setMatchTeam] = useState<Team | null>(null);
  const [club, setClub] = useState<ClubValues | null>(null);
  const [team, setTeam] = useState<TeamValues | null>(null);
  const [matches, setMatches] = useState<MatchValues[]>([]);
  const [allAvailablePlayersList, setAllAvailablePlayersList] = useState<
    AvailablePlayer[]
  >([]);
  const [matchdayOwner, setMatchdayOwner] = useState<{
    clubId: string;
    clubName: string;
    clubAlias: string;
  } | null>(null);
  const licenceTypeBadgeColors: Record<string, string> = {
    PRIMARY: "bg-green-50 text-green-700 ring-green-600/20",
    SECONDARY: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    OVERAGE: "bg-pink-50 text-pink-700 ring-pink-600/20",
    LOAN: "bg-blue-50 text-blue-700 ring-blue-600/20",
    DEVELOPMENT: "bg-purple-50 text-purple-700 ring-purple-600/20",
    SPECIAL: "bg-red-50 text-red-700 ring-red-600/20",
  };

  // Calculate back link once during initialization
  const getBackLink = () => {
    const referrer = typeof window !== "undefined" ? document.referrer : "";
    if (
      referrer &&
      match &&
      referrer.includes(`/tournaments/${match.tournament.alias}`)
    ) {
      return `/tournaments/${match.tournament.alias}`;
    } else if (router.query.from === "tournament" && match) {
      return `/tournaments/${match.tournament.alias}`;
    } else if (router.query.from === "calendar") {
      return `/calendar`;
    } else if (router.query.from === "matchcenter" && match) {
      return `/matches/${match._id}/matchcenter`;
    } else if (match) {
      return `/matches/${match._id}`;
    }
    return "/";
  };

  const [backLink, setBackLink] = useState("/");
  const playerSelectRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [availablePlayersList, setAvailablePlayersList] = useState<
    AvailablePlayer[]
  >([]);
  const [rosterPublished, setRosterPublished] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<RosterPlayer | null>(null);
  const [editPlayerNumber, setEditPlayerNumber] = useState<number>(0);
  const [editPlayerPosition, setEditPlayerPosition] = useState(
    playerPositions[0],
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCallUpModalOpen, setIsCallUpModalOpen] = useState(false);
  const [includeInactivePlayers, setIncludeInactivePlayers] = useState(false);
  const [callUpTeams, setCallUpTeams] = useState<TeamValues[]>([]);
  const [selectedCallUpTeam, setSelectedCallUpTeam] =
    useState<TeamValues | null>(null);
  const [callUpPlayers, setCallUpPlayers] = useState<AvailablePlayer[]>([]);
  const [selectedCallUpPlayer, setSelectedCallUpPlayer] =
    useState<AvailablePlayer | null>(null);
  const [callUpModalError, setCallUpModalError] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<{
    [playerId: string]: number;
  }>({});
  const [coachData, setCoachData] = useState({
    firstName: "",
    lastName: "",
    licence: "",
  });
  const [staffData, setStaffData] = useState<
    { firstName: string; lastName: string; role: string }[]
  >([{ firstName: "", lastName: "", role: "" }]);
  // Initial roster data from server - only used for initial table population
  const [initialRosterData, setInitialRosterData] = useState<RosterPlayer[]>(
    [],
  );

  // NEW STATE: Interactive table-based player selection - SINGLE SOURCE OF TRUTH
  const [tablePlayers, setTablePlayers] = useState<AvailablePlayerWithRoster[]>(
    [],
  );
  const [showLineupOnly, setShowLineupOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort roster by position order: C, A, G, F, then by jersey number
  const sortRoster = React.useCallback(
    (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
      if (!rosterToSort || rosterToSort.length === 0) return [];

      return [...rosterToSort].sort((a, b) => {
        const positionPriority: Record<string, number> = {
          C: 1,
          A: 2,
          G: 3,
          F: 4,
        };
        const posA = positionPriority[a.playerPosition.key] || 99;
        const posB = positionPriority[b.playerPosition.key] || 99;

        if (posA !== posB) {
          return posA - posB;
        }

        const jerseyA = a.player.jerseyNumber || 999;
        const jerseyB = b.player.jerseyNumber || 999;
        return jerseyA - jerseyB;
      });
    },
    [],
  );

  // DERIVED: rosterList is computed from tablePlayers - single source of truth
  const rosterList = React.useMemo((): RosterPlayer[] => {
    const selectedPlayers = tablePlayers.filter((p) => p.selected);
    const roster: RosterPlayer[] = selectedPlayers.map((player) => ({
      player: {
        playerId: player._id,
        firstName: player.firstName,
        lastName: player.lastName,
        jerseyNumber: player.rosterJerseyNo,
      },
      playerPosition: {
        key: player.rosterPosition || "F",
        value:
          playerPositions.find(
            (pos) => pos.key === (player.rosterPosition || "F"),
          )?.value || "Feldspieler",
      },
      passNumber: player.passNo,
      called: player.called || false,
      goals: 0,
      assists: 0,
      points: 0,
      penaltyMinutes: 0,
    }));
    return sortRoster(roster);
  }, [tablePlayers, sortRoster]);

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
  }, [authLoading, user, router]);

  // Fetch all data on mount
  useEffect(() => {
    if (authLoading || !user || !id || !teamFlag) return;

    const fetchData = async () => {
      try {
        setPageLoading(true);

        // Fetch match data
        const matchResponse = await apiClient.get(`/matches/${id}`);
        const matchData: MatchValues = matchResponse.data;
        setMatch(matchData);

        const matchTeamData: Team =
          teamFlag === "home" ? matchData.home : matchData.away;
        setMatchTeam(matchTeamData);
        setInitialRosterData(sortRoster(matchTeamData.roster?.players || []));
        setRosterPublished(matchTeamData.roster?.published || false);
        setCoachData({
          firstName: matchTeamData.roster?.coach?.firstName || "",
          lastName: matchTeamData.roster?.coach?.lastName || "",
          licence: matchTeamData.roster?.coach?.licence || "",
        });
        const initialStaff = matchTeamData.roster?.staff || [];
        const staffArray = [...initialStaff];
        if (staffArray.length === 0) {
          staffArray.push({ firstName: "", lastName: "", role: "" });
        }
        setStaffData(staffArray.slice(0, 4));

        // Get club object
        const clubResponse = await apiClient.get(
          `/clubs/${matchTeamData.clubAlias}`,
        );
        const clubData: ClubValues = clubResponse.data;
        setClub(clubData);

        // Get team object
        const teamResponse = await apiClient.get(
          `/clubs/${matchTeamData.clubAlias}/teams/${matchTeamData.teamAlias}`,
        );
        const teamData: TeamValues = teamResponse.data;
        setTeam(teamData);

        // Fetch available players from the current team
        const teamPlayerResponse = await apiClient.get(
          `/players/clubs/${matchTeamData.clubAlias}/teams/${matchTeamData.teamAlias}`,
          {
            params: {
              sortby: "lastName",
              all: true,
            },
          },
        );
        const teamPlayers: PlayerValues[] = Array.isArray(
          teamPlayerResponse.data,
        )
          ? teamPlayerResponse.data
          : [];
        let allTeamsPlayers: PlayerValues[] = [];
        let additionalPlayers: PlayerValues[] = [];
        let additionalTeamsIds: string[] = [];

        // Handle team partnerships if they exist
        if (
          teamData.teamPartnership &&
          Array.isArray(teamData.teamPartnership) &&
          teamData.teamPartnership.length > 0
        ) {
          for (const partnership of teamData.teamPartnership) {
            if (partnership.clubAlias && partnership.teamAlias) {
              try {
                const partnerTeamResponse = await apiClient.get(
                  `/clubs/${partnership.clubAlias}/teams/${partnership.teamAlias}`,
                );
                const partnerTeam = partnerTeamResponse.data;
                if (partnerTeam && partnerTeam._id) {
                  additionalTeamsIds.push(partnerTeam._id);
                }

                const playersResponse = await apiClient.get(
                  `/players/clubs/${partnership.clubAlias}/teams/${partnership.teamAlias}`,
                  {
                    params: {
                      sortby: "lastName",
                      all: true,
                    },
                  },
                );

                const partnershipPlayers = Array.isArray(playersResponse.data)
                  ? playersResponse.data
                  : [];

                additionalPlayers = [
                  ...additionalPlayers,
                  ...partnershipPlayers,
                ];
              } catch (error) {
                console.error(
                  `Error fetching players from partnership:`,
                  getErrorMessage(error),
                );
              }
            }
          }
        }

        // Combine the players from the current team and all additional players
        allTeamsPlayers = [...teamPlayers, ...additionalPlayers];

        const availablePlayers: AvailablePlayer[] = allTeamsPlayers
          .map((teamPlayer: PlayerValues): AvailablePlayer | null => {
            if (
              !teamPlayer.assignedTeams ||
              !Array.isArray(teamPlayer.assignedTeams)
            ) {
              return null;
            }

            const assignedTeam = teamPlayer.assignedTeams
              .flatMap((assignment: Assignment) => assignment.teams || [])
              .find((team: AssignmentTeam) => {
                if (!team) return false;
                if (team.teamId === matchTeamData.teamId) return true;
                return additionalTeamsIds.some((id) => id === team.teamId);
              });

            const isFromYoungerTeam = additionalTeamsIds.some(
              (id) => assignedTeam && assignedTeam.teamId === id,
            );

            let originalTeamName = null;
            if (isFromYoungerTeam && assignedTeam) {
              const originalTeam = clubData.teams.find(
                (t) => t._id === assignedTeam.teamId,
              );
              if (originalTeam) {
                originalTeamName = originalTeam.name;
              }
            }

            return assignedTeam
              ? {
                  _id: teamPlayer._id,
                  firstName: teamPlayer.firstName,
                  lastName: teamPlayer.lastName,
                  displayFirstName: teamPlayer.displayFirstName,
                  displayLastName: teamPlayer.displayLastName,
                  position: teamPlayer.position || "Skater",
                  fullFaceReq: teamPlayer.fullFaceReq,
                  source: assignedTeam.source,
                  imageUrl: teamPlayer.imageUrl,
                  imageVisible: teamPlayer.imageVisible,
                  passNo: assignedTeam.passNo,
                  jerseyNo: assignedTeam.jerseyNo,
                  called: false,
                  originalTeam: originalTeamName,
                  active: assignedTeam.active,
                  status: assignedTeam.status,
                  licenseType: assignedTeam.licenseType,
                }
              : null;
          })
          .filter((player): player is AvailablePlayer => player !== null);

        const sortedAvailablePlayers = availablePlayers.sort((a, b) => {
          const lastNameComparison = a.lastName.localeCompare(b.lastName);
          return lastNameComparison !== 0
            ? lastNameComparison
            : a.firstName.localeCompare(b.firstName);
        });

        setAllAvailablePlayersList(sortedAvailablePlayers);

        const rosterPlayerIds = (matchTeamData.roster?.players || []).map(
          (rp) => rp.player.playerId,
        );
        const filteredAvailablePlayers = sortedAvailablePlayers.filter(
          (player) => !rosterPlayerIds.includes(player._id),
        );
        setAvailablePlayersList(filteredAvailablePlayers);

        // Fetch other matches of the same matchday
        const matchesResponse = await apiClient.get(`/matches`, {
          params: {
            matchday: matchData.matchday.alias,
            round: matchData.round.alias,
            season: matchData.season.alias,
            tournament: matchData.tournament.alias,
            club: matchTeamData.clubAlias,
            team: matchTeamData.teamAlias,
          },
        });
        setMatches(matchesResponse.data || []);

        // Fetch matchday owner
        try {
          const matchdayResponse = await apiClient.get(
            `/tournaments/${matchData.tournament.alias}/seasons/${matchData.season.alias}/rounds/${matchData.round.alias}/matchdays/${matchData.matchday.alias}`,
          );
          setMatchdayOwner(matchdayResponse.data?.owner || null);
        } catch (error) {
          console.error("Error fetching matchday owner:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", getErrorMessage(error));
        setError("Fehler beim Laden der Daten");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, id, teamFlag, sortRoster]);

  // Update back link when match is loaded
  useEffect(() => {
    if (match) {
      setBackLink(getBackLink());
    }
  }, [match, router.query.from]);

  const minSkaterCount =
    team?.ageGroup === "HERREN" || team?.ageGroup === "DAMEN" ? 4 : 8;

  // Calculate permissions for this user and match
  const permissions =
    match && user
      ? calculateMatchButtonPermissions(
          user,
          match,
          matchdayOwner || undefined,
          backLink.includes("matchcenter"),
        )
      : {
          showButtonRosterHome: false,
          showButtonRosterAway: false,
          showButtonSupplementary: false,
        };
  const hasRosterPermission =
    teamFlag === "home"
      ? permissions.showButtonRosterHome
      : permissions.showButtonRosterAway;

  // Check if all requirements are met for publishing the roster
  // Uses tablePlayers (selected rows) as the source of truth for validation
  const isRosterValid = () => {
    const selectedPlayers = tablePlayers.filter((p) => p.selected);

    const hasZeroJerseyNumber = selectedPlayers.some(
      (player) => player.rosterJerseyNo === 0,
    );
    const hasCaptain = selectedPlayers.some(
      (player) => player.rosterPosition === "C",
    );
    const hasAssistant = selectedPlayers.some(
      (player) => player.rosterPosition === "A",
    );
    const hasGoalie = selectedPlayers.some(
      (player) => player.rosterPosition === "G",
    );
    const skaterCount = selectedPlayers.filter(
      (player) => player.rosterPosition !== "G",
    ).length;
    const hasMinSkater = skaterCount >= minSkaterCount;
    const calledPlayersCount = selectedPlayers.filter(
      (player) => player.called,
    ).length;
    const hasMaxCalledPlayers = calledPlayersCount <= 5;
    const jerseyNumbers = selectedPlayers.map((p) => p.rosterJerseyNo);
    const hasDoubleJerseyNumbers = jerseyNumbers.some(
      (num, index) => jerseyNumbers.indexOf(num) !== index,
    );

    return (
      !hasZeroJerseyNumber &&
      hasCaptain &&
      hasAssistant &&
      hasGoalie &&
      hasMinSkater &&
      hasMaxCalledPlayers &&
      !hasDoubleJerseyNumbers
    );
  };

  // Memoized PDF download link
  const pdfDownloadLink = React.useMemo(() => {
    if (!match || !team || !matchTeam) return null;

    return (
      <PDFDownloadLink
        document={
          <RosterPDF
            teamFlag={teamFlag}
            matchDate={match.startDate}
            venue={match.venue.name}
            roster={sortRoster(rosterList)}
            teamLogo={team.logoUrl}
            tournament={match.tournament.name}
            round={match.round.name}
            homeTeam={match.home}
            awayTeam={match.away}
            coach={coachData}
            staff={staffData.filter(
              (s) => s.firstName.trim() || s.lastName.trim() || s.role.trim(),
            )}
            userEmail={user?.email || ""}
          />
        }
        fileName={`roster-${team.alias}-${new Date().toISOString().split("T")[0]}.pdf`}
        className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        {({ loading }) => (
          <>
            <span className="block sm:hidden">PDF</span>
            <span className="hidden sm:block">
              {loading ? "Generiere PDF..." : "PDF herunterladen"}
            </span>
          </>
        )}
      </PDFDownloadLink>
    );
  }, [
    teamFlag,
    match,
    team,
    matchTeam,
    rosterList,
    coachData,
    staffData,
    user?.email,
    sortRoster,
  ]);

  // Update available players list when the toggle changes
  useEffect(() => {
    if (includeInactivePlayers) {
      const rosterPlayerIds = rosterList.map((rp) => rp.player.playerId);
      const filteredPlayers = allAvailablePlayersList.filter(
        (player) => !rosterPlayerIds.includes(player._id),
      );
      setAvailablePlayersList(filteredPlayers);
    } else {
      const rosterPlayerIds = rosterList.map((rp) => rp.player.playerId);
      const filteredPlayers = allAvailablePlayersList.filter(
        (player) =>
          !rosterPlayerIds.includes(player._id) && player.active !== false,
      );
      setAvailablePlayersList(filteredPlayers);
    }
  }, [includeInactivePlayers, rosterList, allAvailablePlayersList]);

  // Track if initial table sync from initialRosterData has been done
  const initialRosterSyncRef = useRef(false);

  // NEW: Merge allAvailablePlayersList with initial roster data into tablePlayers
  // This runs on initial load and when allAvailablePlayersList/initialRosterData changes
  // The ref prevents infinite loops by only doing the full merge once
  useEffect(() => {
    if (allAvailablePlayersList.length === 0) return;

    setTablePlayers((prev) => {
      // Initial merge: tablePlayers is empty OR we haven't synced initial roster yet
      if (
        prev.length === 0 ||
        (!initialRosterSyncRef.current && initialRosterData.length > 0)
      ) {
        initialRosterSyncRef.current = true;
        const merged: AvailablePlayerWithRoster[] = allAvailablePlayersList.map(
          (player) => {
            const rosterPlayer = initialRosterData.find(
              (rp) => rp.player.playerId === player._id,
            );
            const isSelected = !!rosterPlayer;

            return {
              ...player,
              selected: isSelected,
              rosterJerseyNo:
                rosterPlayer?.player.jerseyNumber ?? player.jerseyNo ?? 0,
              rosterPosition:
                (rosterPlayer?.playerPosition.key as
                  | "C"
                  | "A"
                  | "G"
                  | "F"
                  | null) ?? null,
              statusDiff: false,
              assignedStatus: player.status,
            };
          },
        );
        merged.sort((a, b) => a.firstName.localeCompare(b.firstName));
        return merged;
      }

      // After initial sync: only add new players from allAvailablePlayersList
      // (e.g., players added via call-up that are now in allAvailablePlayersList)
      const existingIds = new Set(prev.map((p) => p._id));
      const newPlayers = allAvailablePlayersList.filter(
        (p) => !existingIds.has(p._id),
      );

      if (newPlayers.length === 0) {
        return prev;
      }

      const newTablePlayers: AvailablePlayerWithRoster[] = newPlayers.map(
        (player) => {
          const rosterPlayer = initialRosterData.find(
            (rp) => rp.player.playerId === player._id,
          );
          const isSelected = !!rosterPlayer;

          return {
            ...player,
            selected: isSelected,
            rosterJerseyNo:
              rosterPlayer?.player.jerseyNumber ?? player.jerseyNo ?? 0,
            rosterPosition:
              (rosterPlayer?.playerPosition.key as
                | "C"
                | "A"
                | "G"
                | "F"
                | null) ?? null,
            statusDiff: false,
            assignedStatus: player.status,
          };
        },
      );

      const combined = [...prev, ...newTablePlayers];
      combined.sort((a, b) => a.firstName.localeCompare(b.firstName));
      return combined;
    });
  }, [allAvailablePlayersList, initialRosterData]);

  // NEW: Handler to toggle player selection in table
  const handleTablePlayerToggle = (playerId: string) => {
    setTablePlayers((prev) =>
      prev.map((player) => {
        if (player._id === playerId) {
          return { ...player, selected: !player.selected };
        }
        return player;
      }),
    );
  };

  // NEW: Handler to update jersey number in table
  const handleTableJerseyChange = (playerId: string, jerseyNo: number) => {
    setTablePlayers((prev) =>
      prev.map((player) => {
        if (player._id === playerId) {
          return { ...player, rosterJerseyNo: jerseyNo };
        }
        return player;
      }),
    );
  };

  // NEW: Handler for position badge click (C, A, G)
  const handleTablePositionToggle = (
    playerId: string,
    position: "C" | "A" | "G",
  ) => {
    setTablePlayers((prev) => {
      const player = prev.find((p) => p._id === playerId);
      if (!player) return prev;

      // If clicking same position, toggle off to F (Feldspieler)
      if (player.rosterPosition === position) {
        return prev.map((p) => {
          if (p._id === playerId) {
            return { ...p, rosterPosition: "F" as const };
          }
          return p;
        });
      }

      // C and A: only one active at a time - deactivate previous
      if (position === "C" || position === "A") {
        return prev.map((p) => {
          if (p._id === playerId) {
            return { ...p, rosterPosition: position, selected: true };
          }
          // Deactivate any other player with this position
          if (p.rosterPosition === position) {
            return { ...p, rosterPosition: "F" as const };
          }
          return p;
        });
      }

      // G: max 2 active
      if (position === "G") {
        const currentGoalies = prev.filter(
          (p) => p.rosterPosition === "G" && p._id !== playerId,
        ).length;
        if (currentGoalies >= 2) {
          setError(
            "Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden",
          );
          return prev;
        }
        return prev.map((p) => {
          if (p._id === playerId) {
            return { ...p, rosterPosition: position, selected: true };
          }
          return p;
        });
      }

      return prev;
    });
  };

  // NOTE: rosterList is now derived via useMemo from tablePlayers (see line ~170)
  // No sync useEffect needed - rosterList automatically updates when tablePlayers changes

  // NEW: Get filtered and sorted table data based on current view settings
  const getFilteredTablePlayers = React.useCallback(() => {
    let filtered = [...tablePlayers];

    // Filter by inactive toggle
    if (!includeInactivePlayers) {
      filtered = filtered.filter((p) => p.active !== false);
    }

    // Filter by lineup only toggle
    if (showLineupOnly) {
      filtered = filtered.filter((p) => p.selected);
      // Sort by position for lineup view: C, A, G, then by jersey
      filtered.sort((a, b) => {
        const positionPriority: Record<string, number> = {
          C: 1,
          A: 2,
          G: 3,
          F: 4,
        };
        const posA = positionPriority[a.rosterPosition || "F"] || 99;
        const posB = positionPriority[b.rosterPosition || "F"] || 99;
        if (posA !== posB) return posA - posB;
        return (a.rosterJerseyNo || 999) - (b.rosterJerseyNo || 999);
      });
    } else {
      // Default sort by firstName
      filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(term) ||
          p.lastName.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [tablePlayers, includeInactivePlayers, showLineupOnly, searchTerm]);

  // NEW: Check for duplicate jersey numbers among selected players
  const hasDuplicateJerseys = React.useMemo(() => {
    const selectedPlayers = tablePlayers.filter((p) => p.selected);
    const jerseyNumbers = selectedPlayers
      .map((p) => p.rosterJerseyNo)
      .filter((n) => n > 0);
    return jerseyNumbers.length !== new Set(jerseyNumbers).size;
  }, [tablePlayers]);

  // Auto-set published to true if match is finished
  const isMatchFinished = match?.matchStatus.key === "FINISHED";
  useEffect(() => {
    if (isMatchFinished) {
      setRosterPublished(true);
    }
  }, [isMatchFinished]);

  // Fetch player stats for called players
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!match || !matchTeam) return;

      const calledPlayers = rosterList.filter((player) => player.called);
      const statsPromises = calledPlayers.map(async (player) => {
        try {
          const response = await apiClient.get(
            `/players/${player.player.playerId}`,
          );

          const playerData = response.data;
          if (playerData.stats && Array.isArray(playerData.stats)) {
            const matchingStats = playerData.stats.find(
              (stat: any) =>
                stat.season?.alias === match.season.alias &&
                stat.tournament?.alias === match.tournament.alias &&
                stat.team?.name === matchTeam.name,
            );

            return {
              playerId: player.player.playerId,
              calledMatches: matchingStats?.calledMatches || 0,
            };
          }

          return {
            playerId: player.player.playerId,
            calledMatches: 0,
          };
        } catch (error) {
          console.error(
            `Error fetching stats for player ${player.player.playerId}:`,
            getErrorMessage(error),
          );
          return {
            playerId: player.player.playerId,
            calledMatches: 0,
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = statsResults.reduce(
        (acc, stat) => {
          acc[stat.playerId] = stat.calledMatches;
          return acc;
        },
        {} as { [playerId: string]: number },
      );

      setPlayerStats(statsMap);
    };

    if (rosterList.some((player) => player.called)) {
      fetchPlayerStats();
    }
  }, [rosterList, match, matchTeam]);

  // Fetch teams from the same club with the same age group
  useEffect(() => {
    if (isCallUpModalOpen && club && team) {
      const fetchTeams = async () => {
        try {
          const teamsResponse = await apiClient.get(
            `/clubs/${club.alias}/teams`,
          );
          const filteredTeams = teamsResponse.data.filter(
            (t: TeamValues) =>
              t.ageGroup === team.ageGroup &&
              t._id !== team._id &&
              t.active &&
              t.teamNumber > team.teamNumber,
          );
          setCallUpTeams(filteredTeams);
        } catch (error) {
          console.error("Error fetching teams:", getErrorMessage(error));
          setCallUpModalError("Fehler beim Laden der Teams");
        }
      };

      fetchTeams();
    }
  }, [isCallUpModalOpen, club, team]);

  // Fetch players when a team is selected
  useEffect(() => {
    if (selectedCallUpTeam && club) {
      const fetchPlayers = async () => {
        try {
          const playersResponse = await apiClient.get(
            `/players/clubs/${club.alias}/teams/${selectedCallUpTeam.alias}`,
            {
              params: {
                sortby: "lastName",
                ...(includeInactivePlayers
                  ? { all: true }
                  : { active: "true" }),
              },
            },
          );

          const players = playersResponse.data || [];

          const formattedPlayers = players
            .map((player: PlayerValues) => {
              const assignedTeam = player.assignedTeams
                ?.flatMap((assignment: Assignment) => assignment.teams || [])
                .find(
                  (team: AssignmentTeam) =>
                    team && team.teamId === selectedCallUpTeam._id,
                );

              return {
                _id: player._id,
                firstName: player.firstName,
                lastName: player.lastName,
                displayFirstName: player.displayFirstName,
                displayLastName: player.displayLastName,
                position: player.position || "Skater",
                fullFaceReq: player.fullFaceReq,
                source: player.source,
                imageUrl: player.imageUrl,
                imageVisible: player.imageVisible,
                passNo: assignedTeam?.passNo || "",
                jerseyNo: assignedTeam?.jerseyNo,
                called: true,
                active: assignedTeam?.active,
                licenseType: assignedTeam?.licenseType,
              };
            })
            .filter(
              (player: AvailablePlayer | null): player is AvailablePlayer =>
                player !== null,
            );

          const rosterPlayerIds = rosterList.map((rp) => rp.player.playerId);
          const filteredPlayers = formattedPlayers.filter(
            (player: AvailablePlayer) => !rosterPlayerIds.includes(player._id),
          );

          setCallUpPlayers(filteredPlayers);
        } catch (error) {
          console.error("Error fetching players:", getErrorMessage(error));
          setCallUpModalError("Fehler beim Laden der Spieler");
          setCallUpPlayers([]);
        }
      };

      fetchPlayers();
    } else {
      setCallUpPlayers([]);
      setSelectedCallUpPlayer(null);
    }
  }, [selectedCallUpTeam, club, rosterList, includeInactivePlayers]);

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMesssage = () => {
    setError(null);
  };

  const handleCloseModalError = () => {
    setModalError(null);
  };

  const handleConfirmCallUp = () => {
    if (!selectedCallUpPlayer) {
      setCallUpModalError("Bitte wähle einen Spieler aus");
      return;
    }

    if (tablePlayers.some((p) => p._id === selectedCallUpPlayer._id)) {
      setCallUpModalError("Dieser Spieler ist bereits in der Liste verfügbar");
      return;
    }

    const playerWithCalled = {
      ...selectedCallUpPlayer,
      called: true,
    };

    // Add to allAvailablePlayersList (the master list) so filters/toggles don't drop call-ups
    setAllAvailablePlayersList((prev) => {
      const newList = [...prev, playerWithCalled];
      return newList.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        return lastNameComparison !== 0
          ? lastNameComparison
          : a.firstName.localeCompare(b.firstName);
      });
    });

    // Add to availablePlayersList for backward compatibility
    setAvailablePlayersList((prev) => {
      const newList = [...prev, playerWithCalled];
      return newList.sort((a, b) => {
        const lastNameComparison = a.lastName.localeCompare(b.lastName);
        return lastNameComparison !== 0
          ? lastNameComparison
          : a.firstName.localeCompare(b.firstName);
      });
    });

    // NEW: Also add to tablePlayers for the new table UI
    const tablePlayerToAdd: AvailablePlayerWithRoster = {
      ...playerWithCalled,
      selected: false,
      rosterJerseyNo: playerWithCalled.jerseyNo || 0,
      rosterPosition: null,
      statusDiff: false,
      assignedStatus: playerWithCalled.status,
    };
    setTablePlayers((prev) => {
      const newList = [...prev, tablePlayerToAdd];
      return newList.sort((a, b) => a.firstName.localeCompare(b.firstName));
    });

    setIsCallUpModalOpen(false);
    setSelectedCallUpTeam(null);
    setSelectedCallUpPlayer(null);
    setCallUpModalError(null);

    setSuccessMessage(
      `Spieler ${selectedCallUpPlayer.firstName} ${selectedCallUpPlayer.lastName} wurde hochgemeldet und steht zur Verfügung.`,
    );
  };

  const handleEditPlayer = (player: RosterPlayer) => {
    setEditingPlayer(player);
    setEditPlayerNumber(player.player.jerseyNumber);
    const position = playerPositions.find(
      (pos) => pos.key === player.playerPosition.key,
    );
    setEditPlayerPosition(position || playerPositions[0]);
    setModalError(null);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPlayer) return;

    // Use tablePlayers (selected rows) for validation - single source of truth
    const selectedPlayers = tablePlayers.filter((p) => p.selected);

    if (
      editPlayerPosition.key === "C" &&
      selectedPlayers.some(
        (player) =>
          player.rosterPosition === "C" &&
          player._id !== editingPlayer.player.playerId,
      )
    ) {
      setModalError(
        "Es kann nur ein Spieler als Captain (C) gekennzeichnet werden",
      );
      return;
    }

    if (
      editPlayerPosition.key === "A" &&
      selectedPlayers.some(
        (player) =>
          player.rosterPosition === "A" &&
          player._id !== editingPlayer.player.playerId,
      )
    ) {
      setModalError(
        "Es kann nur ein Spieler als Assistant (A) gekennzeichnet werden",
      );
      return;
    }

    if (editPlayerPosition.key === "G") {
      const currentPlayer = selectedPlayers.find(
        (p) => p._id === editingPlayer.player.playerId,
      );
      if (currentPlayer?.rosterPosition !== "G") {
        const goalieCount = selectedPlayers.filter(
          (player) => player.rosterPosition === "G",
        ).length;
        if (goalieCount >= 2) {
          setModalError(
            "Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden",
          );
          return;
        }
      }
    }

    if (editPlayerPosition.key === "F") {
      const currentPlayer = selectedPlayers.find(
        (p) => p._id === editingPlayer.player.playerId,
      );
      if (currentPlayer?.rosterPosition !== "F") {
        const feldspielerCount = selectedPlayers.filter(
          (player) => player.rosterPosition === "F",
        ).length;
        if (feldspielerCount >= 14) {
          setModalError(
            "Es können maximal 14 Feldspieler (F) eingetragen werden",
          );
          return;
        }
      }
    }

    // Only update tablePlayers - the useEffect will sync to rosterList
    setTablePlayers((prev) =>
      prev.map((tp) => {
        if (tp._id === editingPlayer.player.playerId) {
          return {
            ...tp,
            rosterJerseyNo: editPlayerNumber,
            rosterPosition: editPlayerPosition.key as
              | "C"
              | "A"
              | "G"
              | "F"
              | null,
          };
        }
        return tp;
      }),
    );

    setIsEditModalOpen(false);
    setEditingPlayer(null);
    setModalError(null);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingPlayer(null);
    setModalError(null);
  };

  const handleSaveRoster = async () => {
    if (match?.matchStatus.key === "FINISHED") {
      setRosterPublished(true);
    }

    setSavingRoster(true);
    setError("");
    let cntAdditionalMatches = 0;

    const rosterUpdate = {
      players: rosterList,
      published: rosterPublished || match?.matchStatus.key === "FINISHED",
      coach: coachData,
      staff: staffData.filter(
        (s) => s.firstName.trim() || s.lastName.trim() || s.role.trim(),
      ),
    };

    try {
      const rosterResponse = await apiClient.put(
        `/matches/${id}/${teamFlag}/roster`,
        rosterUpdate,
      );
      console.log("Roster successfully saved:", rosterResponse.data);

      for (const m of matches.filter((m) => selectedMatches.includes(m._id))) {
        try {
          const matchTeamFlag: "home" | "away" =
            m.home.teamId === matchTeam?.teamId ? "home" : "away";

          const rosterResponse = await apiClient.put(
            `/matches/${m._id}/${matchTeamFlag}/roster`,
            rosterUpdate,
          );
          console.log(`Roster successfully saved for match ${m._id}`);
          cntAdditionalMatches += 1;
        } catch (error) {
          console.error(
            "Error saving roster for additional match:",
            getErrorMessage(error),
          );
          setError(
            `Fehler beim Speichern der Aufstellung für ${m.home.shortName} vs ${m.away.shortName}`,
          );
        }
      }

      setError(null);
    } catch (error: any) {
      if (error.response?.status === 304) {
        console.log("Match not changed (304 Not Modified)");
      } else {
        console.error("Error saving roster/match:", getErrorMessage(error));
        setError("Aufstellung konnte nicht gespeichert werden.");
      }
    } finally {
      setSavingRoster(false);
      if (!error) {
        let successMsg = "";
        if (cntAdditionalMatches === 0) {
          successMsg = "Aufstellung erfolgreich gespeichert.";
        } else {
          successMsg += `Aufstellungen erfolgreich gespeichert`;
          if (cntAdditionalMatches === 1) {
            successMsg += ` (inklusive für ein weiteres Spiel).`;
          } else {
            successMsg += ` (inklusive für ${cntAdditionalMatches} weitere Spiele).`;
          }
        }
        setSuccessMessage(successMsg);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <Layout>
        <LoadingState message="Lade Aufstellung..." />
      </Layout>
    );
  }

  // Return null while redirecting (should not be reached due to useEffect)
  if (!user) {
    return null;
  }

  // Check permissions after loading
  if (!hasRosterPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nicht berechtigt
            </h2>
            <p className="text-gray-500 mb-4">
              Sie haben keine Berechtigung, die Aufstellung für diese Mannschaft
              zu bearbeiten.
            </p>
            <Link
              href={match ? `/matches/${match._id}` : "/"}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Zurück zum Spiel
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match || !team || !matchTeam) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Match not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link href={backLink} className="flex items-center" aria-label="Back">
        <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
        <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
          {backLink.includes("/matchcenter")
            ? "Match Center"
            : backLink.includes("/calendar")
              ? "Kalender"
              : tournamentConfigs[match.tournament.alias]?.name}
        </span>
      </Link>

      <MatchHeader match={match} isRefreshing={false} onRefresh={() => {}} />
      <div className="mt-12">
        <SectionHeader
          title="Mannschaftsaufstellung"
          description={`${team?.fullName} / ${team?.name}`}
          descriptionLogoUrl={team?.logoUrl}
        />
      </div>

      <div className="sm:px-3 pb-2">
        {successMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={handleCloseSuccessMessage}
          />
        )}
        {error && (
          <ErrorMessage error={error} onClose={handleCloseErrorMesssage} />
        )}
      </div>

      {/* Main Form */}
      <div className="bg-white shadow-md rounded-lg border">
        {/* NEW: Action Buttons Row */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* 3 Action Buttons Row */}
            <div className="flex flex-wrap gap-2">
              {/* Hochmelden Button - Opens existing call-up modal */}
              <button
                type="button"
                onClick={() => setIsCallUpModalOpen(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <ArrowUpIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Hochmelden
              </button>

              {/* Inaktive Spieler Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setIncludeInactivePlayers(!includeInactivePlayers)
                }
                className={classNames(
                  includeInactivePlayers
                    ? "bg-indigo-100 ring-indigo-300"
                    : "bg-white ring-gray-300",
                  "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset hover:bg-gray-50",
                )}
              >
                {includeInactivePlayers ? (
                  <EyeIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                )}
                Inaktive Spieler
              </button>

              {/* Aufstellung/Spielerliste Toggle Button */}
              <button
                type="button"
                onClick={() => setShowLineupOnly(!showLineupOnly)}
                className={classNames(
                  showLineupOnly
                    ? "bg-indigo-100 ring-indigo-300"
                    : "bg-white ring-gray-300",
                  "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset hover:bg-gray-50",
                )}
              >
                {showLineupOnly ? (
                  <>
                    <ListBulletIcon
                      className="h-4 w-4 mr-1.5"
                      aria-hidden="true"
                    />
                    Spielerliste
                  </>
                ) : (
                  <>
                    <ClipboardDocumentListIcon
                      className="h-4 w-4 mr-1.5"
                      aria-hidden="true"
                    />
                    Aufstellung
                  </>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Spieler suchen..."
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Interactive Player Selection Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <span className="sr-only">Auswahl</span>
                </th>
                <th
                  scope="col"
                  className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nr.
                </th>
                <th
                  scope="col"
                  className="w-24 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Spieler
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="hidden md:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quelle
                </th>
                <th
                  scope="col"
                  className="hidden sm:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pass Nr.
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hochgemeldet
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredTablePlayers().length > 0 ? (
                getFilteredTablePlayers().map((player) => {
                  const hasEvents =
                    match[teamFlag as "home" | "away"].scores?.some(
                      (score) =>
                        score.goalPlayer.playerId === player._id ||
                        (score.assistPlayer &&
                          score.assistPlayer.playerId === player._id),
                    ) ||
                    match[teamFlag as "home" | "away"].penalties?.some(
                      (penalty) =>
                        penalty.penaltyPlayer.playerId === player._id,
                    );
                  const isDuplicateJersey =
                    player.selected &&
                    player.rosterJerseyNo > 0 &&
                    tablePlayers.filter(
                      (p) =>
                        p.selected &&
                        p.rosterJerseyNo === player.rosterJerseyNo,
                    ).length > 1;

                  return (
                    <tr
                      key={player._id}
                      className={classNames(
                        player.selected ? "bg-green-50 bg-opacity-30" : "",
                        player.active === false ? "opacity-50" : "",
                        isDuplicateJersey ? "bg-yellow-50" : "",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={player.selected}
                          onChange={() => handleTablePlayerToggle(player._id)}
                          disabled={hasEvents && player.selected}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded disabled:opacity-50"
                        />
                      </td>

                      {/* Jersey Number Input */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={player.rosterJerseyNo || ""}
                          onChange={(e) =>
                            handleTableJerseyChange(
                              player._id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className={classNames(
                            "w-14 rounded-md border-0 py-1 px-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-indigo-600",
                            isDuplicateJersey
                              ? "ring-red-500 bg-red-50"
                              : "ring-gray-300",
                            player.rosterJerseyNo === 0 && player.selected
                              ? "ring-yellow-500 bg-yellow-50"
                              : "",
                          )}
                        />
                      </td>

                      {/* Position Badges (C, A, G) */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          {(["C", "A", "G"] as const).map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() =>
                                handleTablePositionToggle(player._id, pos)
                              }
                              className={classNames(
                                "w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-colors",
                                player.rosterPosition === pos
                                  ? pos === "C"
                                    ? "bg-blue-600 text-white"
                                    : pos === "A"
                                      ? "bg-green-600 text-white"
                                      : "bg-purple-600 text-white"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300",
                              )}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Player Image + Name */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {player.imageUrl && player.imageVisible ? (
                            <CldImage
                              src={player.imageUrl}
                              alt={`${player.firstName} ${player.lastName}`}
                              width={32}
                              height={32}
                              crop="thumb"
                              gravity="face"
                              className="h-8 w-8 rounded-full mr-2 object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                {player.firstName.charAt(0)}
                                {player.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </div>
                            {player.originalTeam && (
                              <div className="text-xs text-gray-500">
                                {player.originalTeam}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* license type indicator */}
                      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-gray-500 text-center">
                        <span className={classNames("inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset", (player.licenseType && (licenceTypeBadgeColors as any)[player.licenseType]) || "bg-gray-50 text-gray-700 ring-gray-600/20")}>
                          {player.licenseType}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-gray-500 text-center">
                        <span className={classNames("inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium ring-1 ring-inset", player.source === Source.ISHD ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" : "bg-indigo-50 text-indigo-700 ring-indigo-600/20")}>
                          {player.source}
                        </span>
                      </td>

                      {/* Pass Number */}
                      <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-center">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {player.passNo}
                        </span>
                      </td>

                      {/* Called indicator */}
                      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center gap-2">
                          {player.called && (
                            <span
                              className={classNames(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                playerStats[player._id] !== undefined &&
                                  playerStats[player._id] + 1 <= 4
                                  ? "bg-green-50 text-green-800 ring-green-600/20"
                                  : playerStats[player._id] !== undefined &&
                                      playerStats[player._id] + 1 === 5
                                    ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                                    : "bg-gray-50 text-gray-600 ring-gray-500/20",
                              )}
                            >
                              <ArrowUpIcon
                                className="h-3 w-3 mr-0.5"
                                aria-hidden="true"
                              />
                              {playerStats[player._id] !== undefined
                                ? playerStats[player._id] + 1
                                : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* licence status indicator */}
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex flex-col items-center space-y-1">

                          {/* License Status Badge */}
                          {player.status === LicenseStatus.INVALID ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                              Ungültig
                            </span>
                          ) : player.status === LicenseStatus.VALID ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              Gültig
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              {player.status || "UNKNOWN"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "Keine Spieler gefunden"
                      : "Keine Spieler verfügbar"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Player Count Summary */}
        {tablePlayers.filter((p) => p.selected).length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex justify-between text-sm text-gray-900">
              <span>
                Feldspieler:{" "}
                <span className="font-medium">
                  {
                    tablePlayers.filter(
                      (p) => p.selected && p.rosterPosition !== "G",
                    ).length
                  }
                </span>
              </span>
              <span>
                Goalies:{" "}
                <span className="font-medium">
                  {
                    tablePlayers.filter(
                      (p) => p.selected && p.rosterPosition === "G",
                    ).length
                  }
                </span>
              </span>
              <span>
                Gesamt:{" "}
                <span className="font-medium">
                  {tablePlayers.filter((p) => p.selected).length}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Roster Completeness Check */}
        <div className="p-6 border-t bg-gray-50">
          <div className="space-y-3">
            {/* Captain check indicator */}
            <div className="flex items-center">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player) => player.playerPosition.key === "C") ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
              >
                {rosterList.some(
                  (player) => player.playerPosition.key === "C",
                ) ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some((player) => player.playerPosition.key === "C")
                  ? "Captain (C) wurde festgelegt"
                  : "Es wurde noch kein Captain (C) festgelegt"}
              </span>
            </div>

            {/* Assistant check indicator */}
            <div className="flex items-center">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player) => player.playerPosition.key === "A") ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
              >
                {rosterList.some(
                  (player) => player.playerPosition.key === "A",
                ) ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some((player) => player.playerPosition.key === "A")
                  ? "Assistant (A) wurde festgelegt"
                  : "Es wurde noch kein Assistant (A) festgelegt"}
              </span>
            </div>

            {/* Goalie check indicator */}
            <div className="flex items-center">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player) => player.playerPosition.key === "G") ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
              >
                {rosterList.some(
                  (player) => player.playerPosition.key === "G",
                ) ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some((player) => player.playerPosition.key === "G")
                  ? "Mindestens ein Goalie (G) wurde festgelegt"
                  : "Es wurde noch kein Goalie (G) festgelegt"}
              </span>
            </div>

            {/* Feldspieler check indicator */}
            <div className="flex items-center mt-4">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.filter((player) => player.playerPosition.key != "G").length >= minSkaterCount ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
              >
                {rosterList.filter((player) => player.playerPosition.key != "G")
                  .length >= minSkaterCount ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.filter((player) => player.playerPosition.key != "G")
                  .length >= minSkaterCount
                  ? `Mindestens ${minSkaterCount} Feldspieler wurden festgelegt`
                  : `Es müssen mindestens ${minSkaterCount} Feldspieler festgelegt werden`}
              </span>
            </div>

            {/** Jersey No check indicator */}
            <div className="flex items-center mt-4">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player) => player.player.jerseyNumber === 0) ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}
              >
                {rosterList.some(
                  (player) => player.player.jerseyNumber === 0,
                ) ? (
                  <ExclamationCircleIcon className="h-6 w-6" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some((player) => player.player.jerseyNumber === 0)
                  ? "Es fehlen noch Rückennummern"
                  : "Alle Spieler müssen Rückennummern haben"}
              </span>
            </div>

            {/* Double Jersey No check indicator */}
            <div className="flex items-center mt-4">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some((player, index) => rosterList.findIndex((p) => p.player.jerseyNumber === player.player.jerseyNumber) !== index) ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}
              >
                {rosterList.some(
                  (player, index) =>
                    rosterList.findIndex(
                      (p) =>
                        p.player.jerseyNumber === player.player.jerseyNumber,
                    ) !== index,
                ) ? (
                  <ExclamationCircleIcon className="h-6 w-6" />
                ) : (
                  <CheckCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.some(
                  (player, index) =>
                    rosterList.findIndex(
                      (p) =>
                        p.player.jerseyNumber === player.player.jerseyNumber,
                    ) !== index,
                )
                  ? "Doppelte Rückennummern vorhanden"
                  : "Keine doppelten Rückennummern"}
              </span>
            </div>

            {/* Called players check indicator */}
            <div className="flex items-center mt-4">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.filter((player) => player.called).length <= 5 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
              >
                {rosterList.filter((player) => player.called).length <= 5 ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6" />
                )}
              </div>
              <span className="ml-2 text-sm">
                {rosterList.filter((player) => player.called).length <= 5
                  ? `Hochgemeldete Spieler: ${rosterList.filter((player) => player.called).length} von 5`
                  : `Zu viele hochgemeldete Spieler: ${rosterList.filter((player) => player.called).length} von max. 5`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coach and Staff Section */}
      <h2 className="mt-8 mb-3 text-lg font-medium text-gray-900 border-b pb-2">
        Teamoffizielle
      </h2>

      {/* Coach Section */}
      <div className="mt-2">
        <div className="py-4">
          <h3 className="text-md font-medium text-gray-900 mb-4">Trainer</h3>
          <div className="px-6 pt-4 pb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 border rounded-md shadow bg-gray-50">
            <div>
              <label
                htmlFor="coach-firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vorname
              </label>
              <input
                type="text"
                id="coach-firstName"
                value={coachData.firstName}
                onChange={(e) =>
                  setCoachData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="coach-lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nachname
              </label>
              <input
                type="text"
                id="coach-lastName"
                value={coachData.lastName}
                onChange={(e) =>
                  setCoachData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="coach-licence"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Lizenz
              </label>
              <input
                type="text"
                id="coach-licence"
                value={coachData.licence}
                onChange={(e) =>
                  setCoachData((prev) => ({ ...prev, licence: e.target.value }))
                }
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className="py-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Betreuer (max. 4)
          </h4>
          <div className="border rounded-md shadow bg-gray-50 divide-y divide-gray-200">
            {staffData
              .slice(
                0,
                Math.max(
                  1,
                  staffData.filter(
                    (s) =>
                      s.firstName.trim() || s.lastName.trim() || s.role.trim(),
                  ).length + 1,
                ),
              )
              .map((staff, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4 pb-6 px-6`}
                >
                  <div>
                    <label
                      htmlFor={`staff-${index}-firstName`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Vorname
                    </label>
                    <input
                      type="text"
                      id={`staff-${index}-firstName`}
                      value={staff.firstName}
                      onChange={(e) => {
                        const newStaffData = [...staffData];
                        newStaffData[index] = {
                          ...newStaffData[index],
                          firstName: e.target.value,
                        };
                        setStaffData(newStaffData);
                      }}
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`staff-${index}-lastName`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nachname
                    </label>
                    <input
                      type="text"
                      id={`staff-${index}-lastName`}
                      value={staff.lastName}
                      onChange={(e) => {
                        const newStaffData = [...staffData];
                        newStaffData[index] = {
                          ...newStaffData[index],
                          lastName: e.target.value,
                        };
                        setStaffData(newStaffData);
                      }}
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`staff-${index}-role`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Funktion
                    </label>
                    <input
                      type="text"
                      id={`staff-${index}-role`}
                      value={staff.role}
                      onChange={(e) => {
                        const newStaffData = [...staffData];
                        newStaffData[index] = {
                          ...newStaffData[index],
                          role: e.target.value,
                        };
                        setStaffData(newStaffData);
                      }}
                      className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              ))}

            {/* Add Staff Button */}
            {staffData.slice(
              0,
              Math.max(
                1,
                staffData.filter(
                  (s) =>
                    s.firstName.trim() || s.lastName.trim() || s.role.trim(),
                ).length + 1,
              ),
            ).length < 4 && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => {
                    const filledStaffCount = staffData.filter(
                      (s) =>
                        s.firstName.trim() ||
                        s.lastName.trim() ||
                        s.role.trim(),
                    ).length;
                    if (filledStaffCount < 4) {
                      const newStaffData = [...staffData];
                      const nextEmptyIndex = newStaffData.findIndex(
                        (s) =>
                          !s.firstName.trim() &&
                          !s.lastName.trim() &&
                          !s.role.trim(),
                      );
                      if (nextEmptyIndex === -1 && newStaffData.length < 4) {
                        newStaffData.push({
                          firstName: "",
                          lastName: "",
                          role: "",
                        });
                      }
                      setStaffData(newStaffData);
                    }
                  }}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <PlusIcon
                    className="mr-1.5 -ml-0.5 h-5 w-5"
                    aria-hidden="true"
                  />
                  Hinzufügen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Matchday Matches */}
      {matches.filter((m) => {
        if (m._id === match._id) return false;
        const matchDate = new Date(match.startDate);
        const otherMatchDate = new Date(m.startDate);
        return matchDate.toDateString() === otherMatchDate.toDateString();
      }).length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-medium text-gray-900 border-b pb-2">
            Weitere Spiele am gleichen Spieltag
          </h2>
          <div className="bg-white mb-6 px-6">
            {match.matchday &&
              match.round &&
              match.season &&
              match.tournament && (
                <ul className="divide-y divide-gray-200">
                  {matches
                    .filter((m) => {
                      if (m._id === match._id) return false;
                      const matchDate = new Date(match.startDate);
                      const otherMatchDate = new Date(m.startDate);
                      return (
                        matchDate.toDateString() ===
                        otherMatchDate.toDateString()
                      );
                    })
                    .map((m) => (
                      <li key={m._id} className="px-4 py-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <input
                              id={`match-${m._id}`}
                              type="checkbox"
                              value={m._id}
                              disabled={m.matchStatus.key !== "SCHEDULED"}
                              className={`w-4 h-4 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                                m.matchStatus.key === "SCHEDULED"
                                  ? "text-blue-600 bg-gray-100"
                                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
                              }`}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMatches((prev) => [
                                    ...prev,
                                    m._id,
                                  ]);
                                } else {
                                  setSelectedMatches((prev) =>
                                    prev.filter((id) => id !== m._id),
                                  );
                                }
                              }}
                            />
                            <div className="flex-shrink-0 h-8 w-8">
                              <CldImage
                                src={
                                  m[
                                    m.home.teamId === matchTeam?.teamId
                                      ? "away"
                                      : "home"
                                  ].logo ||
                                  "https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                                }
                                alt="Team logo"
                                width={32}
                                height={32}
                                gravity="center"
                                className="object-contain"
                              />
                            </div>
                            <div className="text-sm text-gray-900">
                              {
                                m[
                                  m.home.teamId === matchTeam?.teamId
                                    ? "away"
                                    : "home"
                                ].shortName
                              }
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {m.matchStatus.key === "SCHEDULED" ? (
                              new Date(m.startDate).toLocaleTimeString(
                                "de-DE",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              ) + " Uhr"
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

      {/* Publish Roster Toggle */}
      <div className="flex items-center justify-between mt-12 p-6 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              Veröffentlichen
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {(() => {
                const allChecksPass = isRosterValid();
                const isFinished = match.matchStatus.key === "FINISHED";

                if (isFinished) {
                  return "Aufstellung ist veröffentlicht (Spiel beendet)";
                } else if (!allChecksPass) {
                  const errors = [];

                  if (
                    !rosterList.some(
                      (player) => player.playerPosition.key === "C",
                    )
                  ) {
                    errors.push("kein Captain");
                  }
                  if (
                    !rosterList.some(
                      (player) => player.playerPosition.key === "A",
                    )
                  ) {
                    errors.push("kein Assistant");
                  }
                  if (
                    !rosterList.some(
                      (player) => player.playerPosition.key === "G",
                    )
                  ) {
                    errors.push("kein Goalie");
                  }
                  if (
                    rosterList.filter(
                      (player) => player.playerPosition.key != "G",
                    ).length < minSkaterCount
                  ) {
                    errors.push(`weniger als ${minSkaterCount} Feldspieler`);
                  }
                  if (
                    rosterList.some(
                      (player) => player.player.jerseyNumber === 0,
                    )
                  ) {
                    errors.push("fehlende Rückennummern");
                  }
                  if (
                    rosterList.some(
                      (player, index) =>
                        rosterList.findIndex(
                          (p) =>
                            p.player.jerseyNumber ===
                            player.player.jerseyNumber,
                        ) !== index,
                    )
                  ) {
                    errors.push("doppelte Rückennummern");
                  }
                  if (rosterList.filter((player) => player.called).length > 5) {
                    errors.push("zu viele hochgemeldete Spieler");
                  }

                  return `Speichern möglich auch mit Fehlern: ${errors.join(", ")}`;
                } else {
                  return "Aufstellung öffentlich sichtbar machen";
                }
              })()}
            </span>
          </div>
          <Switch
            checked={rosterPublished || match.matchStatus.key === "FINISHED"}
            onChange={(enabled) => {
              if (match.matchStatus.key !== "FINISHED") {
                setRosterPublished(enabled);
              }
            }}
            disabled={match.matchStatus.key === "FINISHED"}
            className={`${
              rosterPublished || match.matchStatus.key === "FINISHED"
                ? "bg-indigo-600"
                : "bg-gray-200"
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ml-2 ${match.matchStatus.key === "FINISHED" ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span className="sr-only">Veröffentlichen</span>
            <span
              aria-hidden="true"
              className={`${
                rosterPublished || match.matchStatus.key === "FINISHED"
                  ? "translate-x-5"
                  : "translate-x-0"
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>
      </div>

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
          disabled={loading || savingRoster}
          className="w-24 inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 hover:bg-indigo-500 py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {savingRoster ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"
              ></path>
            </svg>
          ) : (
            "Speichern"
          )}
        </button>
      </div>

      {/* Edit Player Modal */}
      {isEditModalOpen && editingPlayer && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Spieler bearbeiten: {editingPlayer.player.lastName},{" "}
              {editingPlayer.player.firstName}
            </h3>

            {/* Jersey Number */}
            <div className="mb-4">
              <label
                htmlFor="edit-player-number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jersey Number
              </label>
              <input
                type="text"
                id="edit-player-number"
                value={editPlayerNumber}
                onChange={(e) =>
                  setEditPlayerNumber(parseInt(e.target.value) || 0)
                }
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="##"
              />
            </div>

            {/* Player Position */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Listbox
                value={editPlayerPosition}
                onChange={setEditPlayerPosition}
              >
                {({ open }) => (
                  <>
                    <div className="relative">
                      <Listbox.Button
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLButtonElement>,
                        ) => {
                          const key = e.key.toUpperCase();
                          if (["C", "A", "G", "F"].includes(key)) {
                            e.preventDefault();
                            const position = playerPositions.find(
                              (pos) => pos.key === key,
                            );
                            if (position) {
                              setEditPlayerPosition(position);
                            }
                          }
                        }}
                        className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <span className="block truncate">
                          {editPlayerPosition.key} - {editPlayerPosition.value}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
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
                                  active
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-900",
                                  "relative cursor-default select-none py-2 pl-3 pr-9",
                                )
                              }
                              value={position}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={classNames(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "block truncate",
                                    )}
                                  >
                                    {position.key} - {position.value}
                                  </span>

                                  {selected ? (
                                    <span
                                      className={classNames(
                                        active
                                          ? "text-white"
                                          : "text-indigo-600",
                                        "absolute inset-y-0 right-0 flex items-center pr-4",
                                      )}
                                    >
                                      <CheckIcon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
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

            {modalError && (
              <ErrorMessage
                error={modalError}
                onClose={handleCloseModalError}
              />
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="w-28 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call-Up Player Modal */}
      <Transition appear show={isCallUpModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10"
          onClose={() => {
            setIsCallUpModalOpen(false);
            setSelectedCallUpTeam(null);
            setSelectedCallUpPlayer(null);
            setCallUpModalError(null);
          }}
        >
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg text-center font-bold leading-6 text-gray-900 mb-4"
                  >
                    Spieler hochmelden
                  </Dialog.Title>

                  {callUpModalError && (
                    <div className="text-red-600 text-sm mt-2 mb-4">
                      {callUpModalError}
                    </div>
                  )}

                  {/* Include Inactive Players Toggle */}
                  <div className="flex flex-row items-center justify-between sm:justify-end mb-4">
                    <span className="text-sm text-gray-700 sm:mr-4">
                      Inaktive Spieler anzeigen
                    </span>
                    <Switch
                      checked={includeInactivePlayers}
                      onChange={setIncludeInactivePlayers}
                      className={`${
                        includeInactivePlayers ? "bg-indigo-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          includeInactivePlayers
                            ? "translate-x-5"
                            : "translate-x-0"
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </div>

                  {/* Team Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team
                    </label>
                    <Listbox
                      value={selectedCallUpTeam}
                      onChange={setSelectedCallUpTeam}
                    >
                      {({ open }) => (
                        <>
                          <div className="relative">
                            <Listbox.Button
                              tabIndex={1}
                              className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                              <span
                                className={`block truncate ${selectedCallUpTeam ? "" : "text-gray-400"}`}
                              >
                                {selectedCallUpTeam
                                  ? selectedCallUpTeam.name
                                  : "Mannschaft auswählen"}
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
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
                                          active
                                            ? "bg-indigo-600 text-white"
                                            : "text-gray-900",
                                          "relative cursor-default select-none py-2 pl-3 pr-9",
                                        )
                                      }
                                      value={teamItem}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <span
                                            className={classNames(
                                              selected
                                                ? "font-semibold"
                                                : "font-normal",
                                              "block truncate",
                                            )}
                                          >
                                            {teamItem.name}
                                          </span>

                                          {selected ? (
                                            <span
                                              className={classNames(
                                                active
                                                  ? "text-white"
                                                  : "text-indigo-600",
                                                "absolute inset-y-0 right-0 flex items-center pr-4",
                                              )}
                                            >
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
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
                  <RosterPlayerSelect
                    ref={playerSelectRef}
                    name="call-up-player-select"
                    tabIndex={2}
                    selectedPlayer={
                      selectedCallUpPlayer
                        ? {
                            player: {
                              playerId: selectedCallUpPlayer._id,
                              firstName: selectedCallUpPlayer.firstName,
                              lastName: selectedCallUpPlayer.lastName,
                              jerseyNumber: selectedCallUpPlayer.jerseyNo || 0,
                            },
                            playerPosition: { key: "F", value: "Feldspieler" },
                            passNumber: selectedCallUpPlayer.passNo,
                            called: selectedCallUpPlayer.called,
                            goals: 0,
                            assists: 0,
                            points: 0,
                            penaltyMinutes: 0,
                          }
                        : null
                    }
                    onChange={(selectedRosterPlayer) => {
                      if (selectedRosterPlayer) {
                        const availablePlayer = callUpPlayers.find(
                          (p) => p._id === selectedRosterPlayer.player.playerId,
                        );
                        if (availablePlayer) {
                          setSelectedCallUpPlayer(availablePlayer);
                          setCallUpModalError(null);
                        }
                      } else {
                        setSelectedCallUpPlayer(null);
                      }
                    }}
                    roster={callUpPlayers.map((player) => ({
                      player: {
                        playerId: player._id,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        jerseyNumber: player.jerseyNo || 0,
                      },
                      playerPosition: { key: "F", value: "Feldspieler" },
                      passNumber: player.passNo,
                      called: player.called,
                      goals: 0,
                      assists: 0,
                      points: 0,
                      penaltyMinutes: 0,
                    }))}
                    label="Spieler"
                    placeholder={
                      selectedCallUpTeam
                        ? "Spieler auswählen"
                        : "Bitte zuerst eine Mannschaft auswählen"
                    }
                    required={false}
                    showErrorText={false}
                  />

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCallUpModalOpen(false);
                        setSelectedCallUpTeam(null);
                        setSelectedCallUpPlayer(null);
                        setCallUpModalError(null);
                      }}
                      tabIndex={4}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          const teamSelect = document.querySelector(
                            '[tabindex="1"]',
                          ) as HTMLButtonElement;
                          if (teamSelect) {
                            teamSelect.focus();
                          }
                        }
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCallUp}
                      disabled={!selectedCallUpPlayer}
                      tabIndex={3}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          const cancelButton =
                            e.currentTarget.parentElement?.querySelector(
                              "button:last-child",
                            ) as HTMLButtonElement;
                          if (cancelButton) {
                            cancelButton.focus();
                          }
                        }
                      }}
                      className="w-28 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hochmelden
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Layout>
  );
};

export default RosterPage;
