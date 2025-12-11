import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import Head from "next/head";
import useAuth from "../../../../hooks/useAuth";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { Dialog, Transition } from "@headlessui/react";
import {
  MatchValues,
  RosterPlayer,
  PenaltiesBase,
  ScoresBase,
  SupplementarySheet,
} from "../../../../types/MatchValues";
import { MatchdayOwner } from "../../../../types/TournamentValues";
import Layout from "../../../../components/Layout";
import { getCookie } from "cookies-next";
import apiClient from '../../../../lib/apiClient';
import { getErrorMessage } from '../../../../lib/errorHandler';

let BASE_URL = process.env["NEXT_PUBLIC_API_URL"];
import {
  CalendarIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { tournamentConfigs, allFinishTypes } from "../../../../tools/consts";
import {
  classNames,
  calculateMatchButtonPermissions,
} from "../../../../tools/utils";
import MatchStatusBadge from "../../../../components/ui/MatchStatusBadge";
import MatchHeader from "../../../../components/ui/MatchHeader";
import Badge from "../../../../components/ui/Badge";
import FinishTypeSelect from "../../../../components/admin/ui/FinishTypeSelect";
import MatchStatus from "../../../../components/admin/ui/MatchStatus";
import GoalDialog from "../../../../components/ui/GoalDialog";
import PenaltyDialog from "../../../../components/ui/PenaltyDialog";
import RosterTab from "../../../../components/matchcenter/RosterTab";
import GoalsTab from "../../../../components/matchcenter/GoalsTab";
import PenaltiesTab from "../../../../components/matchcenter/PenaltiesTab";
import SupplementaryTab from "../../../../components/matchcenter/SupplementaryTab";

interface MatchDetailsProps {
  match: MatchValues;
  matchdayOwner: MatchdayOwner;
  jwt?: string;
  userRoles?: string[];
  userClubId?: string | null;
}

interface EditMatchData {
  venue: { venueId: string; name: string; alias: string };
  startDate: string;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  homeScore: number;
  awayScore: number;
}

const tabs = [
  { id: "roster", name: "Aufstellung" },
  { id: "goals", name: "Tore" },
  { id: "penalties", name: "Strafen" },
  { id: "supplementary", name: "Zusatzblatt" },
];

// Reusable Info Card Component
interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div
      className={`overflow-hidden bg-white rounded-md shadow-md border ${className}`}
    >
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
};

export default function MatchDetails({
  match: initialMatch,
  matchdayOwner,
  jwt,
  userRoles,
  userClubId,
}: MatchDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [match, setMatch] = useState<MatchValues>(initialMatch);

  const getBackLink = () => {
    const referrer = typeof window !== "undefined" ? document.referrer : "";
    // Check referrer if it exists
    if (
      referrer &&
      referrer.includes(`/tournaments/${match.tournament.alias}`)
    ) {
      return `/tournaments/${match.tournament.alias}`;
    }
    // Check if there's a query parameter indicating source
    else if (router.query.from === "tournament") {
      return `/tournaments/${match.tournament.alias}`;
    } else if (router.query.from === "calendar") {
      return `/calendar`;
    }
    // Default to match sheet
    else {
      return `/matches/${match._id}`;
    }
  };
  const [backLink] = useState(() => getBackLink());

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFinishType, setSelectedFinishType] = useState({
    key: "REGULAR",
    value: "Regulär",
  });
  const [isHomeGoalDialogOpen, setIsHomeGoalDialogOpen] = useState(false);
  const [isAwayGoalDialogOpen, setIsAwayGoalDialogOpen] = useState(false);
  const [isHomePenaltyDialogOpen, setIsHomePenaltyDialogOpen] = useState(false);
  const [isAwayPenaltyDialogOpen, setIsAwayPenaltyDialogOpen] = useState(false);
  const [editingHomePenalty, setEditingHomePenalty] = useState<
    PenaltiesBase | undefined
  >(undefined);
  const [editingAwayPenalty, setEditingAwayPenalty] = useState<
    PenaltiesBase | undefined
  >(undefined);
  const [editingHomeGoal, setEditingHomeGoal] = useState<
    ScoresBase | undefined
  >(undefined);
  const [editingAwayGoal, setEditingAwayGoal] = useState<
    ScoresBase | undefined
  >(undefined);
  const [homePlayerStats, setHomePlayerStats] = useState<{
    [playerId: string]: number;
  }>({});
  const [awayPlayerStats, setAwayPlayerStats] = useState<{
    [playerId: string]: number;
  }>({});
  const [isSavingMatchSheetComplete, setIsSavingMatchSheetComplete] =
    useState(false);
  const [savingSupplementaryField, setSavingSupplementaryField] = useState<
    string | null
  >(null);
  {
    /**
  const [editData, setEditData] = useState<EditMatchData>({
    venue: match.venue,
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
    matchStatus: match.matchStatus,
    finishType: match.finishType,
    homeScore: match.home.stats.goalsFor,
    awayScore: match.away.stats.goalsFor
  });
  */
  }

  // Get active tab from query parameter, default to 'roster'
  const getActiveTabFromQuery = useCallback(() => {
    const { tab } = router.query;
    const validTabs = ["roster", "goals", "penalties", "supplementary"];
    return validTabs.includes(tab as string) ? (tab as string) : "roster";
  }, [router.query]);

  // Update active tab when query parameter changes
  useEffect(() => {
    const newActiveTab = getActiveTabFromQuery();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [router.query.tab, activeTab, getActiveTabFromQuery]);

  // Fetch player stats for called players
  useEffect(() => {
    const fetchPlayerStats = async (
      roster: RosterPlayer[],
      team: { name: string },
    ) => {
      if (!jwt) return {};

      const calledPlayers = roster.filter((player) => player.called);
      if (calledPlayers.length === 0) return {};

      const statsPromises = calledPlayers.map(async (player) => {
        try {
          const response = await apiClient.get(
            `/players/${player.player.playerId}`
          );

          const playerData = response.data;
          if (playerData.stats && Array.isArray(playerData.stats)) {
            // Find stats that match the current match context
            const matchingStats = playerData.stats.find(
              (stat: any) =>
                stat.season?.alias === match.season.alias &&
                stat.tournament?.alias === match.tournament.alias &&
                stat.team?.name === team.name,
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
            error,
          );
          return {
            playerId: player.player.playerId,
            calledMatches: 0,
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      return statsResults.reduce(
        (acc, stat) => {
          acc[stat.playerId] = stat.calledMatches;
          return acc;
        },
        {} as { [playerId: string]: number },
      );
    };

    const fetchAllPlayerStats = async () => {
      // Fetch home team stats
      if (
        match.home.roster &&
        match.home.roster.some((player: RosterPlayer) => player.called)
      ) {
        const homeStats = await fetchPlayerStats(match.home.roster, {
          name: match.home.name,
        });
        setHomePlayerStats(homeStats);
      }

      // Fetch away team stats
      if (
        match.away.roster &&
        match.away.roster.some((player: RosterPlayer) => player.called)
      ) {
        const awayStats = await fetchPlayerStats(match.away.roster, {
          name: match.away.name,
        });
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
      const response = await apiClient.get(`/matches/${id}`);
      setMatch(response.data);
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error refreshing match data:", error);
      setIsRefreshing(false);
    }
  }, [id, isRefreshing]);

  // Function to handle supplementary sheet field updates
  const updateSupplementaryField = async (fieldName: string, value: any) => {
    try {
      setSavingSupplementaryField(fieldName);
      const response = await apiClient.patch(
        `/matches/${match._id}`,
        {
          supplementarySheet: {
            ...match.supplementarySheet,
            [fieldName]: value,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200) {
        setMatch({
          ...match,
          supplementarySheet: {
            ...match.supplementarySheet,
            [fieldName]: value,
          },
        });
      }
    } catch (error) {
      console.error(`Error updating supplementary field ${fieldName}:`, error);
    } finally {
      setSavingSupplementaryField(null);
    }
  };

  const permissions = calculateMatchButtonPermissions(
    user,
    match,
    matchdayOwner,
    true,
  );
  const hasMatchCenterPermission = permissions.showButtonMatchCenter;

  // Don't render the page if user doesn't have permission
  if (!hasMatchCenterPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nicht berechtigt
            </h2>
            <p className="text-gray-500 mb-4">
              Sie haben keine Berechtigung, die Match Center für dieses Spiel
              aufzurufen.
            </p>
            <Link href={`/matches/${match._id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Zurück zum Spiel
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>
          Match Center - {match.home.shortName} - {match.away.shortName}
        </title>
      </Head>
      <Layout>
        <div className="flex items-center justify-between text-gray-500 hover:text-gray-700 text-sm font-base">
          <Link href={backLink} className="flex items-center">
            <ChevronLeftIcon
              aria-hidden="true"
              className="h-3 w-3 text-gray-400"
            />
            <span className="ml-2">
              {backLink.includes("/matchcenter")
                ? "Match Center"
                : backLink.includes("/calendar")
                  ? "Kalender"
                  : tournamentConfigs[match.tournament.alias]?.name}
            </span>
          </Link>

          <Link href={`/matches/${match._id}`} className="flex items-center">
            <span className="mr-2">Spielbericht</span>
            <ChevronRightIcon
              aria-hidden="true"
              className="h-3 w-3 text-gray-400"
            />
          </Link>
        </div>

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
              {permissions.showButtonEvents &&
                match.matchStatus.key === "INPROGRESS" && (
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
            {permissions.showButtonStatus && (
              <>
                {match.matchStatus.key === "SCHEDULED" && (
                  <button
                    onClick={async () => {
                      try {
                        setIsRefreshing(true);
                        const response = await apiClient.patch(
                          `/matches/${match._id}`,
                          {
                            matchStatus: {
                              key: "INPROGRESS",
                              value: "Live",
                            },
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${jwt}`,
                              "Content-Type": "application/json",
                            },
                          },
                        );

                        if (response.status === 200) {
                          // Update local state instead of reloading
                          const updatedMatch = response.data;
                          setMatch(updatedMatch);
                        }
                      } catch (error) {
                        console.error("Error updating match status:", error);
                      } finally {
                        setIsRefreshing(false);
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {isRefreshing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Starten
                      </>
                    ) : (
                      "Starten"
                    )}
                  </button>
                )}

                <button
                  onClick={() => setIsStatusDialogOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ergebnis
                </button>
                {match.matchStatus.key === "INPROGRESS" && (
                  <button
                    onClick={() => setIsFinishDialogOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent shadow-md text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {isRefreshing ? (
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
                      "Beenden"
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Away Team Buttons */}
          <div className="w-1/3 flex justify-center">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {permissions.showButtonEvents &&
                match.matchStatus.key === "INPROGRESS" && (
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
          <nav
            aria-label="Tabs"
            className="-mb-px flex justify-center px-0 sm:px-4 md:px-12"
          >
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => {
                  router.push(
                    {
                      pathname: router.pathname,
                      query: { ...router.query, tab: tab.id },
                    },
                    undefined,
                    { shallow: true },
                  );
                }}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={classNames(
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                  "w-1/3 border-b-2 px-1 py-4 text-center text-sm sm:text-base sm:text-md font-medium",
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="py-6">
          {activeTab === "roster" && (
            <div className="py-4">
              <RosterTab
                match={match}
                permissions={{
                  showButtonRosterHome: permissions.showButtonRosterHome ?? false,
                  showButtonRosterAway: permissions.showButtonRosterAway ?? false,
                }}
                homePlayerStats={homePlayerStats}
                awayPlayerStats={awayPlayerStats}
              />
            </div>
          )}

          {activeTab === "goals" && (
            <div className="py-4">
              <GoalsTab
                match={match}
                permissions={{
                  showButtonScoresHome: permissions.showButtonScoresHome ?? false,
                  showButtonScoresAway: permissions.showButtonScoresAway ?? false,
                  showButtonEvents: permissions.showButtonEvents ?? false,
                }}
                refreshMatchData={refreshMatchData}
                setIsHomeGoalDialogOpen={setIsHomeGoalDialogOpen}
                setIsAwayGoalDialogOpen={setIsAwayGoalDialogOpen}
                setEditingHomeGoal={setEditingHomeGoal}
                setEditingAwayGoal={setEditingAwayGoal}
              />
            </div>
          )}

          {activeTab === "penalties" && (
            <div className="py-4">
              <PenaltiesTab
                match={match}
                permissions={{
                  showButtonPenaltiesHome: permissions.showButtonPenaltiesHome ?? false,
                  showButtonPenaltiesAway: permissions.showButtonPenaltiesAway ?? false,
                  showButtonEvents: permissions.showButtonEvents ?? false,
                }}
                refreshMatchData={refreshMatchData}
                setIsHomePenaltyDialogOpen={setIsHomePenaltyDialogOpen}
                setIsAwayPenaltyDialogOpen={setIsAwayPenaltyDialogOpen}
                setEditingHomePenalty={setEditingHomePenalty}
                setEditingAwayPenalty={setEditingAwayPenalty}
              />
            </div>
          )}

          {activeTab === "supplementary" && (
            <SupplementaryTab
              match={match}
              jwt={jwt}
              permissions={{
                showButtonSupplementary: permissions.showButtonSupplementary ?? false,
              }}
            />
          )}
        </div>

        {/* Referees Section */}
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Schiedsrichter
        </h3>
        <div className="bg-white rounded-md shadow-md border px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-12">
            {match.referee1 ? (
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {match.referee1.firstName.charAt(0)}
                  {match.referee1.lastName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {match.referee1.firstName} {match.referee1.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {match.referee1.clubName && `${match.referee1.clubName}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-400">
                    Nicht eingeteilt
                  </p>
                  <p className="text-xs text-gray-500">Schiedsrichter 1</p>
                </div>
              </div>
            )}

            {match.referee2 ? (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {match.referee2.firstName.charAt(0)}
                  {match.referee2.lastName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {match.referee2.firstName} {match.referee2.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {match.referee2.clubName && `${match.referee2.clubName}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-400">
                    Nicht eingeteilt
                  </p>
                  <p className="text-xs text-gray-500">Schiedsrichter 2</p>
                </div>
              </div>
            )}
          </div>

          {/* Match Sheet Complete Toggle */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                Spielbericht vollständig
              </span>
              <span className="text-xs text-gray-500">
                Markiere das Spiel als vollständig erfasst
              </span>
            </div>
            <button
              type="button"
              disabled={isSavingMatchSheetComplete}
              onClick={async () => {
                try {
                  setIsSavingMatchSheetComplete(true);
                  const newCompleteStatus = !match.matchSheetComplete;
                  const response = await apiClient.patch(
                    `/matches/${match._id}`,
                    {
                      matchSheetComplete: newCompleteStatus,
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  if (response.status === 200) {
                    setMatch({
                      ...match,
                      matchSheetComplete: newCompleteStatus,
                    });
                  }
                } catch (error) {
                  console.error(
                    "Error updating match sheet complete status:",
                    error,
                  );
                } finally {
                  setIsSavingMatchSheetComplete(false);
                }
              }}
              className={classNames(
                match.matchSheetComplete ? "bg-indigo-600" : "bg-gray-200",
                isSavingMatchSheetComplete
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
                "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
              )}
            >
              <span className="sr-only">Spielbericht vollständig</span>
              {isSavingMatchSheetComplete ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-3 w-3 text-indigo-600"
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
                </div>
              ) : (
                <span
                  aria-hidden="true"
                  className={classNames(
                    match.matchSheetComplete ? "translate-x-5" : "translate-x-0",
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  )}
                />
              )}
            </button>
          </div>
        </div>

        {/* Finish Match Dialog */}
        <Transition appear show={isFinishDialogOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-10"
            onClose={() => setIsFinishDialogOpen(false)}
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
                  <div className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>

                {/* This element is to trick the browser into centering the modal contents. */}
                <span
                  className="inline-block h-screen align-middle"
                  aria-hidden="true"
                >
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
                      className="text-lg text-center font-bold leading-6 text-gray-900 mb-4"
                    >
                      Spiel beenden
                    </Dialog.Title>

                    <div className="mt-4">
                      <FinishTypeSelect
                        selectedType={selectedFinishType}
                        types={allFinishTypes}
                        onTypeChange={(typeKey) => {
                          const selectedType = allFinishTypes.find(
                            (t) => t.key === typeKey,
                          );
                          if (selectedType) {
                            setSelectedFinishType({
                              key: typeKey,
                              value: selectedType.value,
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
                            const response = await apiClient.patch(
                              `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
                              {
                                matchStatus: {
                                  key: "FINISHED",
                                  value: "Beendet",
                                },
                                finishType: selectedFinishType,
                              },
                              {
                                headers: {
                                  Authorization: `Bearer ${jwt}`,
                                  "Content-Type": "application/json",
                                },
                              },
                            );

                            if (response.status === 200) {
                              // Update local state
                              const updatedMatch = response.data;
                              setMatch(updatedMatch);
                              setIsFinishDialogOpen(false);
                            }
                          } catch (error) {
                            console.error("Error finishing match:", error);
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                      >
                        {isRefreshing ? (
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        ) : null}
                        Spiel beenden
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Home Team Goal Dialog */}
        <GoalDialog
          isOpen={isHomeGoalDialogOpen}
          onClose={() => {
            setIsHomeGoalDialogOpen(false);
            setEditingHomeGoal(undefined);
          }}
          matchId={match._id}
          teamFlag="home"
          roster={[...(match.home.roster || [])].sort(
            (a, b) => a.player.jerseyNumber - b.player.jerseyNumber,
          )}
          jwt={jwt || ""}
          onSuccess={refreshMatchData}
          editGoal={editingHomeGoal}
        />

        {/* Away Team Goal Dialog */}
        <GoalDialog
          isOpen={isAwayGoalDialogOpen}
          onClose={() => {
            setIsAwayGoalDialogOpen(false);
            setEditingAwayGoal(undefined);
          }}
          matchId={match._id}
          teamFlag="away"
          roster={[...(match.away.roster || [])].sort(
            (a, b) => a.player.jerseyNumber - b.player.jerseyNumber,
          )}
          jwt={jwt || ""}
          onSuccess={refreshMatchData}
          editGoal={editingAwayGoal}
        />

        {/* Home Team Penalty Dialog */}
        <PenaltyDialog
          isOpen={isHomePenaltyDialogOpen}
          onClose={() => {
            setIsHomePenaltyDialogOpen(false);
            setEditingHomePenalty(undefined);
          }}
          matchId={match._id}
          teamFlag="home"
          roster={[...(match.home.roster || [])].sort(
            (a, b) => a.player.jerseyNumber - b.player.jerseyNumber,
          )}
          jwt={jwt || ""}
          onSuccess={refreshMatchData}
          editPenalty={editingHomePenalty}
        />

        {/* Away Team Penalty Dialog */}
        <PenaltyDialog
          isOpen={isAwayPenaltyDialogOpen}
          onClose={() => {
            setIsAwayPenaltyDialogOpen(false);
            setEditingAwayPenalty(undefined);
          }}
          matchId={match._id}
          teamFlag="away"
          roster={[...(match.away.roster || [])].sort(
            (a, b) => a.player.jerseyNumber - b.player.jerseyNumber,
          )}
          jwt={jwt || ""}
          onSuccess={refreshMatchData}
          editPenalty={editingAwayPenalty}
        />

        {/* Status Dialog */}
        <MatchStatus
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          match={match}
          jwt={jwt || ""}
          onSuccess={(updatedMatch) => {
            if (updatedMatch && updatedMatch._id) {
              setMatch({ ...match, ...updatedMatch });
            }
          }}
          onMatchUpdate={async (updatedMatch) => {
            if (updatedMatch && updatedMatch._id) {
              setMatch({ ...match, ...updatedMatch });
            }
          }}
        />
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    // Only fetch match data (public data)
    const matchResponse = await apiClient.get(`/matches/${id}`);
    const match = matchResponse.data;

    // Fetch matchday owner data
    let matchdayOwner: MatchdayOwner | null = null;
    try {
      const matchdayResponse = await apiClient.get(
        `/tournaments/${match.tournament.alias}/seasons/${match.season.alias}/rounds/${match.round.alias}/matchdays/${match.matchday.alias}`
      );
      matchdayOwner = matchdayResponse.data?.owner || null;
    } catch (error) {
      console.error('Error fetching matchday owner:', error);
    }

    return {
      props: {
        match,
        matchdayOwner,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
};