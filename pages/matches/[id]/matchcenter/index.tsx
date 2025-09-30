import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import Head from 'next/head';
import useAuth from "../../../../hooks/useAuth";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { Dialog, Transition } from "@headlessui/react";
import {
  Match,
  RosterPlayer,
  PenaltiesBase,
  ScoresBase,
} from "../../../../types/MatchValues";
import { MatchdayOwner } from "../../../../types/TournamentValues";
import Layout from "../../../../components/Layout";
import { getCookie } from "cookies-next";
import axios from "axios";

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
import FinishTypeSelect from "../../../../components/admin/ui/FinishTypeSelect";
import MatchStatus from "../../../../components/admin/ui/MatchStatus";
import GoalDialog from "../../../../components/ui/GoalDialog";
import PenaltyDialog from "../../../../components/ui/PenaltyDialog";
import RosterList from "../../../../components/ui/RosterList";
import ScoreList from "../../../../components/ui/ScoreList";
import PenaltyList from "../../../../components/ui/PenaltyList";

interface MatchDetailsProps {
  match: Match;
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
  const [match, setMatch] = useState<Match>(initialMatch);

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
  const [isSavingMatchSheetComplete, setIsSavingMatchSheetComplete] = useState(false);
  const [savingSupplementaryField, setSavingSupplementaryField] = useState<string | null>(null);
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
          const response = await axios.get(
            `${BASE_URL}/players/${player.player.playerId}`,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            },
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
        match.home.roster.some((player) => player.called)
      ) {
        const homeStats = await fetchPlayerStats(match.home.roster, {
          name: match.home.name,
        });
        setHomePlayerStats(homeStats);
      }

      // Fetch away team stats
      if (
        match.away.roster &&
        match.away.roster.some((player) => player.called)
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`,
      );
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
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
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
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

  return (
    <>
      <Head>
        <title>Match Center - {match.home.shortName} - {match.away.shortName}</title>
      </Head>
      <Layout>
        <div className="flex items-center justify-between text-gray-500 hover:text-gray-700 text-sm font-base">
          <Link href={backLink}>
            <a className="flex items-center">
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
            </a>
          </Link>

          <Link href={`/matches/${match._id}`}>
            <a className="flex items-center">
              <span className="mr-2">Spielbericht</span>
              <ChevronRightIcon
                aria-hidden="true"
                className="h-3 w-3 text-gray-400"
              />
            </a>
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
                        const response = await axios.patch(
                          `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
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
                  "w-1/3 border-b-2 px-1 py-4 text-center text-md font-medium",
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
              {/* Sort function for roster */}
              {(() => {
                // Sort roster by position order: C, A, G, F, then by jersey number
                const sortRoster = (rosterToSort: RosterPlayer[]) => {
                  if (!rosterToSort || rosterToSort.length === 0) return [];

                  return [...rosterToSort].sort((a, b) => {
                    // Define position priorities (C = 1, A = 2, G = 3, F = 4)
                    const positionPriority = { C: 1, A: 2, G: 3, F: 4 };

                    // Get priorities
                    const posA =
                      positionPriority[
                        a.playerPosition.key as keyof typeof positionPriority
                      ] || 99;
                    const posB =
                      positionPriority[
                        b.playerPosition.key as keyof typeof positionPriority
                      ] || 99;

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
                        editUrl={`/matches/${match._id}/home/roster?from=matchcenter`}
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
                        editUrl={`/matches/${match._id}/away/roster?from=matchcenter`}
                        sortRoster={sortRoster}
                        playerStats={awayPlayerStats}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "goals" && (
            <div className="py-4">
              {/* Container for side-by-side or stacked goals */}
              <div className="flex flex-col md:flex-row md:space-x-8">
                {/* Home team goals */}
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <ScoreList
                    jwt={jwt || ""}
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
                    jwt={jwt || ""}
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

          {activeTab === "penalties" && (
            <div className="py-4">
              {/* Container for side-by-side or stacked penalties */}
              <div className="flex flex-col md:flex-row md:space-x-8">
                {/* Home team penalties */}
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <PenaltyList
                    jwt={jwt || ""}
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
                    jwt={jwt || ""}
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

          {activeTab === "supplementary" && (
            <div className="py-4">
              <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Zusatzblatt
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      Alle aktivieren/deaktivieren
                    </span>
                    <button
                      type="button"
                      disabled={savingSupplementaryField === "masterToggle" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                      onClick={async () => {
                        try {
                          setSavingSupplementaryField("masterToggle");

                          // Determine if we should activate or deactivate all
                          const currentSheet = match.supplementarySheet || {};
                          const booleanFields = [
                            'referee1PassAvailable', 'referee2PassAvailable',
                            'ruleBook', 'goalDisplay', 'soundSource', 'matchClock',
                            'matchBalls', 'firstAidKit', 'fieldLines', 'nets',
                            'homeRoster', 'homePlayerPasses', 'homeUniformPlayerClothing',
                            'awayRoster', 'awayPlayerPasses', 'awayUniformPlayerClothing',
                            'awaySecondJerseySet'
                          ];

                          // Check if any field is currently true - if so, set all to false, otherwise set all to true
                          const hasAnyTrue = booleanFields.some(field => currentSheet[field as keyof typeof currentSheet]);
                          const newValue = !hasAnyTrue;

                          // Create the updated supplementary sheet object
                          const updatedSheet = {
                            ...currentSheet,
                            referee1PassAvailable: newValue,
                            referee2PassAvailable: newValue,
                            ruleBook: newValue,
                            goalDisplay: newValue,
                            soundSource: newValue,
                            matchClock: newValue,
                            matchBalls: newValue,
                            firstAidKit: newValue,
                            fieldLines: newValue,
                            nets: newValue,
                            homeRoster: newValue,
                            homePlayerPasses: newValue,
                            homeUniformPlayerClothing: newValue,
                            awayRoster: newValue,
                            awayPlayerPasses: newValue,
                            awayUniformPlayerClothing: newValue,
                            awaySecondJerseySet: newValue,
                          };

                          const response = await axios.patch(
                            `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
                            {
                              supplementarySheet: updatedSheet,
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
                              supplementarySheet: updatedSheet,
                            });
                          }
                        } catch (error) {
                          console.error("Error updating all supplementary fields:", error);
                        } finally {
                          setSavingSupplementaryField(null);
                        }
                      }}
                      className={classNames(
                        (() => {
                          const currentSheet = match.supplementarySheet || {};
                          const booleanFields = [
                            'referee1PassAvailable', 'referee2PassAvailable',
                            'ruleBook', 'goalDisplay', 'soundSource', 'matchClock',
                            'matchBalls', 'firstAidKit', 'fieldLines', 'nets',
                            'homeRoster', 'homePlayerPasses', 'homeUniformPlayerClothing',
                            'awayRoster', 'awayPlayerPasses', 'awayUniformPlayerClothing',
                            'awaySecondJerseySet'
                          ];
                          const hasAnyTrue = booleanFields.some(field => currentSheet[field as keyof typeof currentSheet]);
                          return hasAnyTrue ? "bg-indigo-600" : "bg-gray-200";
                        })(),
                        savingSupplementaryField === "masterToggle" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          (() => {
                            const currentSheet = match.supplementarySheet || {};
                            const booleanFields = [
                              'referee1PassAvailable', 'referee2PassAvailable',
                              'ruleBook', 'goalDisplay', 'soundSource', 'matchClock',
                              'matchBalls', 'firstAidKit', 'fieldLines', 'nets',
                              'homeRoster', 'homePlayerPasses', 'homeUniformPlayerClothing',
                              'awayRoster', 'awayPlayerPasses', 'awayUniformPlayerClothing',
                              'awaySecondJerseySet'
                            ];
                            const hasAnyTrue = booleanFields.some(field => currentSheet[field as keyof typeof currentSheet]);
                            return hasAnyTrue ? "translate-x-5" : "translate-x-0";
                          })(),
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Referee Attendance Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Schiedsrichter
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Anwesenheit
                        </span>
                        <span className="text-xs text-gray-500">
                          Sind die offiziell eingeteilten Schiedsrichter angetreten?
                        </span>
                      </div>
                      <select
                        value={match.supplementarySheet?.refereeAttendance || ""}
                        onChange={(e) => updateSupplementaryField("refereeAttendance", e.target.value)}
                        disabled={savingSupplementaryField === "refereeAttendance"}
                        className="ml-4 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Auswählen...</option>
                        <option value="yes">Ja</option>
                        <option value="only 1">Nur 1</option>
                        <option value="no referee">Kein Schiedsrichter</option>
                        <option value="substitute referee">Ersatz Schiedsrichter</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Schiedsrichter 1 Pass liegt vor
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={savingSupplementaryField === "referee1PassAvailable" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        onClick={() => updateSupplementaryField("referee1PassAvailable", !match.supplementarySheet?.referee1PassAvailable)}
                        className={classNames(
                          match.supplementarySheet?.referee1PassAvailable ? "bg-indigo-600" : "bg-gray-200",
                          savingSupplementaryField === "referee1PassAvailable" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={classNames(
                            match.supplementarySheet?.referee1PassAvailable ? "translate-x-5" : "translate-x-0",
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Schiedsrichter 2 Pass liegt vor
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={savingSupplementaryField === "referee2PassAvailable" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        onClick={() => updateSupplementaryField("referee2PassAvailable", !match.supplementarySheet?.referee2PassAvailable)}
                        className={classNames(
                          match.supplementarySheet?.referee2PassAvailable ? "bg-indigo-600" : "bg-gray-200",
                          savingSupplementaryField === "referee2PassAvailable" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={classNames(
                            match.supplementarySheet?.referee2PassAvailable ? "translate-x-5" : "translate-x-0",
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Schiedsrichter 1 Verspätung (Min)
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={match.supplementarySheet?.referee1DelayMin || 0}
                        onChange={(e) => updateSupplementaryField("referee1DelayMin", parseInt(e.target.value) || 0)}
                        disabled={savingSupplementaryField === "referee1DelayMin" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        className="ml-4 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Schiedsrichter 2 Verspätung (Min)
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={match.supplementarySheet?.referee2DelayMin || 0}
                        onChange={(e) => updateSupplementaryField("referee2DelayMin", parseInt(e.target.value) || 0)}
                        disabled={savingSupplementaryField === "referee2DelayMin" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        className="ml-4 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment Check Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Dokumente / Ausrüstung
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "ruleBook", label: "Spielregeln/WKO", description: "Sind die aktuellen Spielregeln und WKO verfügbar?" },
                      { key: "goalDisplay", label: "Manuelle Toranzeige", description: "Ist eine manuelle Toranzeige vorhanden?" },
                      { key: "soundSource", label: "Ersatz-Tonquelle", description: "Ist eine Ersatz-Tonquelle (Pfeife/Horn) verfügbar?" },
                      { key: "matchClock", label: "Spieluhr", description: "Ist eine funktionierende Spieluhr vorhanden?" },
                      { key: "matchBalls", label: "10 Spielbälle", description: "Sind mind. 10 regelkonforme Spielbälle verfügbar?" },
                      { key: "firstAidKit", label: "Erste-Hilfe-Ausrüstung", description: "Ist vollständige Erste-Hilfe-Ausrüstung vorhanden?" },
                      { key: "fieldLines", label: "Pflichtlinien", description: "Ist das Spielfeld vollständig mit allen Pflichtlinien markiert?" },
                      { key: "nets", label: "Tornetze", description: "Sind regelkonforme Tornetze angebracht?" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {item.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          onClick={() => updateSupplementaryField(item.key, !match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet])}
                          className={classNames(
                            match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "bg-indigo-600" : "bg-gray-200",
                            savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                            "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "translate-x-5" : "translate-x-0",
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Equipment Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Mannschaften
                  </h4>

                  {/* Home Team */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Heimmannschaft - {match.home.fullName}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: "homeRoster", label: "Aufstellung rechtzeitig veröfffentlicht", description: "Wurde die Aufstellung fristgerecht veröffentlicht?" },
                        { key: "homePlayerPasses", label: "Spielerpässe vollständig", description: "Liegen alle Spielerpässe vor?" },
                        { key: "homeUniformPlayerClothing", label: "Einheitliche Spielerkleidung", description: "Einheitliche Helme, Trikots, Hosen?" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.description}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                            onClick={() => updateSupplementaryField(item.key, !match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet])}
                            className={classNames(
                              match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "bg-indigo-600" : "bg-gray-200",
                              savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "translate-x-5" : "translate-x-0",
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Gastmannschaft - {match.away.fullName}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "awayRoster", label: "Aufstellung rechtzeitig veröfffentlicht", description: "Wurde die Aufstellung fristgerecht veröffentlicht?" },
                        { key: "awayPlayerPasses", label: "Spielerpässe vollständig", description: "Liegen alle Spielerpässe vor?" },
                        { key: "awayUniformPlayerClothing", label: "Einheitliche Spielerkleidung", description: "Einheitliche Helme, Trikots, Hosen?" },
                        { key: "awaySecondJerseySet", label: "Zweiter Trikotsatz", description: "Ist bei Farbkonflikten ein zweiter Trikotsatz verfügbar?" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.description}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                            onClick={() => updateSupplementaryField(item.key, !match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet])}
                            className={classNames(
                              match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "bg-indigo-600" : "bg-gray-200",
                              savingSupplementaryField === item.key || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                match.supplementarySheet?.[item.key as keyof typeof match.supplementarySheet] ? "translate-x-5" : "translate-x-0",
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Special Events and Comments Section */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Besondere Vorkommnisse
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Besondere Vorkommnisse
                        </span>
                        <span className="text-xs text-gray-500">
                          Gab es besondere Vorkommnisse während des Spiels?
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={savingSupplementaryField === "specialEvents" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        onClick={() => updateSupplementaryField("specialEvents", !match.supplementarySheet?.specialEvents)}
                        className={classNames(
                          match.supplementarySheet?.specialEvents ? "bg-indigo-600" : "bg-gray-200",
                          savingSupplementaryField === "specialEvents" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={classNames(
                            match.supplementarySheet?.specialEvents ? "translate-x-5" : "translate-x-0",
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          )}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Schiedsrichter Kommentare
                      </label>
                      <textarea
                        value={match.supplementarySheet?.refereeComments || ""}
                        onChange={(e) => updateSupplementaryField("refereeComments", e.target.value)}
                        disabled={savingSupplementaryField === "refereeComments" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Kommentare des Schiedsrichters zu besonderen Vorkommnissen, Problemen oder Anmerkungen..."
                      />
                    </div>
                  </div>
                </div>

                {/* Referee Payment Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Schiedsrichter Vergütung
                  </h4>

                  {/* Referee 1 Payment */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Schiedsrichter 1
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reisekosten (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee1?.travelExpenses || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee1: {
                              ...match.supplementarySheet?.refereePayment?.referee1,
                              travelExpenses: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Aufwandsentschädigung (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee1?.expenseAllowance || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee1: {
                              ...match.supplementarySheet?.refereePayment?.referee1,
                              expenseAllowance: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Spielgebühren (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee1?.gameFees || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee1: {
                              ...match.supplementarySheet?.refereePayment?.referee1,
                              gameFees: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Referee 2 Payment */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Schiedsrichter 2
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reisekosten (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee2?.travelExpenses || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee2: {
                              ...match.supplementarySheet?.refereePayment?.referee2,
                              travelExpenses: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Aufwandsentschädigung (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee2?.expenseAllowance || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee2: {
                              ...match.supplementarySheet?.refereePayment?.referee2,
                              expenseAllowance: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Spielgebühren (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={match.supplementarySheet?.refereePayment?.referee2?.gameFees || 0}
                          onChange={(e) => updateSupplementaryField("refereePayment", {
                            ...match.supplementarySheet?.refereePayment,
                            referee2: {
                              ...match.supplementarySheet?.refereePayment?.referee2,
                              gameFees: parseFloat(e.target.value) || 0
                            }
                          })}
                          disabled={savingSupplementaryField === "refereePayment" || !["SCHEDULED", "INPROGRESS"].includes(match.matchStatus.key)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                            const response = await axios.patch(
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
            d
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

        {/* Referees Section */}
        <div className="py-6 mt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Schiedsrichter
          </h3>
          <div className="bg-white rounded-lg shadow px-4 py-5 sm:p-6">
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
                      Nicht zugewiesen
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
                      Nicht zugewiesen
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
                    const response = await axios.patch(
                      `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
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
                  isSavingMatchSheetComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
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
                      match.matchSheetComplete
                        ? "translate-x-5"
                        : "translate-x-0",
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    )}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const jwt = (getCookie("jwt", context) || "") as string;

  try {
    const match: Match = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`,
    ).then((res) => res.json());
    //console.log("match", match)
    let userRoles: string[] = [];
    let userClubId: string | null = null;

    if (jwt) {
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const userData = await userResponse.json();
      userRoles = userData.roles || [];

      // Get user's club ID if available
      if (userData.club && userData.club.clubId) {
        userClubId = userData.club.clubId;
      }
    }

    const matchday = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${match.tournament.alias}/seasons/${match.season.alias}/rounds/${match.round.alias}/matchdays/${match.matchday.alias}/`,
    ).then((res) => res.json());

    return {
      props: {
        match,
        matchdayOwner: matchday.owner,
        jwt,
        userRoles,
        userClubId: userClubId || null,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};