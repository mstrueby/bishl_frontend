import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useAuth from "../../../hooks/useAuth";
import { useRouter } from "next/router";
import { CldImage } from "next-cloudinary";
import { MatchValues, RosterPlayer } from "../../../types/MatchValues";
import { MatchdayOwner } from "../../../types/TournamentValues";
import { timeToSeconds, groupByPeriod } from "../../../utils/matchPeriods";
import Layout from "../../../components/Layout";
import apiClient from "../../../lib/apiClient";
import { getErrorMessage } from "../../../lib/errorHandler";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { tournamentConfigs } from "../../../tools/consts";
import { calculateMatchButtonPermissions } from "../../../tools/utils";
import MatchHeader from "../../../components/ui/MatchHeader";
import MatchSettingsDisplay from "../../../components/ui/MatchSettingsDisplay";
import LoadingState from "../../../components/ui/LoadingState";


interface RosterTableProps {
  teamName: string;
  roster: RosterPlayer[];
  isPublished: boolean;
  numOfPeriods: number;
}

// Reusable RosterTable component
const RosterTable: React.FC<RosterTableProps> = ({
  teamName,
  roster,
  isPublished,
  numOfPeriods,
}) => {
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

  const sortedRoster = sortRoster(roster || []);
  const hasGoalies = sortedRoster.some((p) => p.playerPosition.key === "G");

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
                {hasGoalies && (
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                )}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  V
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P
                </th>
                {/**
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SM
                </th>
                */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRoster.map((player) => {
                const isGoalie = player.playerPosition.key === "G";
                return (
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
                              {player.player.displayFirstName?.charAt(0)}
                              {player.player.displayLastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span>
                          {player.player.displayFirstName}{" "}
                          {player.player.displayLastName}
                        </span>
                      </div>
                    </td>
                    {hasGoalies && (
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        {isGoalie ? (
                          <div className="flex items-center justify-center gap-1">
                            {Array.from({ length: numOfPeriods }, (_, i) => i + 1).map((period) => {
                              const played = (player.periodsPlayed ?? []).includes(period);
                              return played ? (
                                <span
                                  key={period}
                                  className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-white"
                                >
                                  {period}
                                </span>
                              ) : (
                                <span
                                  key={period}
                                  className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-400"
                                >
                                  {period}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.goals || 0}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.assists || 0}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.points || 0}
                    </td>
                    {/**
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.penaltyMinutes || 0}
                    </td>
                    */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {!isPublished
              ? "Aufstellung noch nicht eingereicht"
              : "Keine Aufstellung verfügbar"}
          </div>
        )}
      </div>
    </div>
  );
};

export default function MatchDetails() {
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [matchdayOwner, setMatchdayOwner] = useState<MatchdayOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Initial data fetch with status-based routing
  useEffect(() => {
    if (!router.isReady || typeof id !== "string") return;

    const fetchMatchData = async () => {
      let redirecting = false;
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await apiClient.get(`/matches/${id}`);
        const fetchedMatch: MatchValues = response.data;

        const status = fetchedMatch.matchStatus.key;
        if (status === "INPROGRESS") {
          redirecting = true;
          router.replace(`/matches/${id}/live`);
          return;
        }
        if (
          status === "SCHEDULED" ||
          status === "CANCELLED" ||
          status === "FORFEITED"
        ) {
          redirecting = true;
          router.replace("/404");
          return;
        }

        // FINISHED — set match and fetch matchday owner
        setMatch(fetchedMatch);

        try {
          const matchdayResponse = await apiClient.get(
            `/tournaments/${fetchedMatch.tournament.alias}/seasons/${fetchedMatch.season.alias}/rounds/${fetchedMatch.round.alias}/matchdays/${fetchedMatch.matchday.alias}`,
          );
          setMatchdayOwner(matchdayResponse.data?.owner ?? null);
        } catch {
          setMatchdayOwner(null);
        }
      } catch (error) {
        console.error("Error fetching match:", getErrorMessage(error));
        setFetchError(getErrorMessage(error));
      } finally {
        // Keep spinner visible while navigating away to avoid error flash
        if (!redirecting) {
          setIsLoading(false);
        }
      }
    };

    fetchMatchData();
  }, [router.isReady, id]);

  // Manual refresh (for the refresh button in MatchHeader)
  const refreshMatchData = useCallback(async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await apiClient.get(`/matches/${id}`);
      setMatch(response.data);
    } catch (error) {
      console.error("Error refreshing match data:", getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }, [id, isRefreshing]);

  const RefereeInfo = ({
    assigned,
    referee = {},
    position,
  }: {
    assigned: boolean;
    referee?: any;
    position: number;
  }) => (
    <div className="flex items-center px-6 py-4">
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
        {assigned ? (
          `${referee?.firstName?.charAt(0) || ""}${referee?.lastName?.charAt(0) || ""}`
        ) : (
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
        )}
      </div>
      <div className="ml-4">
        <p
          className={`text-sm font-medium ${assigned ? "text-gray-900" : "text-gray-400"}`}
        >
          {assigned
            ? `${referee?.firstName || ""} ${referee?.lastName || ""}`
            : "Nicht zugewiesen"}
        </p>
        <p className="text-xs text-gray-500">
          {assigned && referee?.clubName
            ? referee.clubName
            : `Schiedsrichter ${position}`}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Spiel wird geladen..." />
      </Layout>
    );
  }

  if (fetchError || !match) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Spiel nicht gefunden.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between text-gray-500 hover:text-gray-700 text-sm font-base">
        <Link
          href={`/tournaments/${match.tournament.alias}`}
          aria-label="Back to tournament"
          className="flex items-center"
        >
          <ChevronLeftIcon
            aria-hidden="true"
            className="h-3 w-3 text-gray-400"
          />
          <span className="ml-2">
            {tournamentConfigs[match.tournament.alias]?.name}
          </span>
        </Link>

        {(() => {
          const permissions = calculateMatchButtonPermissions(
            user,
            match,
            matchdayOwner ?? undefined,
          );
          return (
            permissions.showButtonMatchCenter && (
              <Link
                href={`/matches/${match._id}/matchcenter/`}
                className="flex items-center"
              >
                <span className="mr-2">Matchcenter</span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="h-3 w-3 text-gray-400"
                />
              </Link>
            )
          );
        })()}
      </div>

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
              roster={match.home.roster?.players || []}
              isPublished={match.home.roster?.status != "DRAFT" || false}
              numOfPeriods={match.matchSettings.numOfPeriods}
            />
          </div>

          {/* Away team roster */}
          <div className="w-full md:w-1/2 mt-4 md:mt-0">
            <RosterTable
              teamName={match.away.fullName}
              roster={match.away.roster?.players || []}
              isPublished={match.away.roster?.status != "DRAFT" || false}
              numOfPeriods={match.matchSettings.numOfPeriods}
            />
          </div>
        </div>
      </div>

      {/* All Goals Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tore</h3>
        <div className="bg-white rounded-md shadow-md overflow-hidden border">
          {(() => {
            const allGoals = [
              ...(match.home.scores || []).map((goal) => ({
                ...goal,
                teamName: match.home.fullName,
                teamFlag: "home",
              })),
              ...(match.away.scores || []).map((goal) => ({
                ...goal,
                teamName: match.away.fullName,
                teamFlag: "away",
              })),
            ];

            const sortedGoals = allGoals.sort(
              (a, b) => timeToSeconds(a.matchTime) - timeToSeconds(b.matchTime),
            );

            let homeScore = 0;
            let awayScore = 0;
            const goalsWithScore = sortedGoals.map((goal) => {
              if (goal.teamFlag === "home") homeScore++;
              else awayScore++;
              return { ...goal, currentScore: `${homeScore}-${awayScore}` };
            });

            const eventGroups = groupByPeriod(
              goalsWithScore,
              (g) => g.matchTime,
              match.matchSettings,
            );

            const periodNames: Record<number, string> = { 2: "Halbzeit", 3: "Drittel", 4: "Viertel" };
            const periodName = periodNames[match.matchSettings.numOfPeriods] || "Periode";
            const regulationLabels = Array.from(
              { length: match.matchSettings.numOfPeriods },
              (_, i) => `${i + 1}. ${periodName}`,
            );
            const allGroups = [
              ...regulationLabels.map((label) => ({
                label,
                items: eventGroups.find((g) => g.label === label)?.items ?? [],
              })),
              ...eventGroups.filter((g) => !regulationLabels.includes(g.label)),
            ];

            return (
              <ul className="divide-y divide-gray-200">
                {allGroups.flatMap((group) => [
                  <li
                    key={`header-${group.label}`}
                    className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {group.label}
                  </li>,
                  ...(group.items.length === 0
                    ? [
                        <li
                          key={`empty-${group.label}`}
                          className="px-4 py-4 text-sm text-gray-400 text-center italic"
                        >
                          Keine Tore in diesem Abschnitt
                        </li>,
                      ]
                    : group.items.map((goal, index) => (
                    <li
                      key={`${goal.teamFlag}-${group.label}-${index}`}
                      className="flex items-center py-4 px-4 sm:px-6"
                    >
                      <div className="flex-shrink-0 w-[32px] h-[32px] sm:w-[32px] sm:h-[32px] mx-auto mr-6">
                        <CldImage
                          src={
                            goal.teamFlag === "home"
                              ? match.home.logo
                              : match.away.logo
                          }
                          alt={
                            goal.teamFlag === "home"
                              ? match.home.tinyName
                              : match.away.tinyName
                          }
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
                      <div className="flex-shrink-0 text-center ml-6 mr-3">
                        {goal.goalPlayer &&
                        goal.goalPlayer.imageUrl &&
                        goal.goalPlayer.imageVisible ? (
                          <CldImage
                            src={goal.goalPlayer.imageUrl}
                            alt={`${goal.goalPlayer.displayFirstName} ${goal.goalPlayer.displayLastName}`}
                            width={32}
                            height={32}
                            gravity="center"
                            radius="max"
                            className="w-8 h-8 object-cover"
                          />
                        ) : goal.goalPlayer ? (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {goal.goalPlayer.displayFirstName?.charAt(0)}
                              {goal.goalPlayer.displayLastName?.charAt(0)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-900">
                          {goal.goalPlayer
                            ? `${goal.goalPlayer.displayFirstName} ${goal.goalPlayer.displayLastName}`
                            : "Unbekannt"}
                        </p>
                        {goal.assistPlayer ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {goal.assistPlayer.displayFirstName}{" "}
                            {goal.assistPlayer.displayLastName}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Keine Vorlage
                          </p>
                        )}
                      </div>
                    </li>
                  ))),
                ])}
              </ul>
            );
          })()}
        </div>
      </div>

      {/* All Penalties Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Strafen</h3>
        <div className="bg-white rounded-md shadow-md overflow-hidden border">
          {(() => {
            const allPenalties = [
              ...(match.home.penalties || []).map((penalty) => ({
                ...penalty,
                teamName: match.home.fullName,
                teamFlag: "home",
              })),
              ...(match.away.penalties || []).map((penalty) => ({
                ...penalty,
                teamName: match.away.fullName,
                teamFlag: "away",
              })),
            ];

            const sortedPenalties = allPenalties.sort(
              (a, b) =>
                timeToSeconds(a.matchTimeStart) -
                timeToSeconds(b.matchTimeStart),
            );

            const eventGroups = groupByPeriod(
              sortedPenalties,
              (p) => p.matchTimeStart,
              match.matchSettings,
            );

            const periodNames: Record<number, string> = { 2: "Halbzeit", 3: "Drittel", 4: "Viertel" };
            const periodName = periodNames[match.matchSettings.numOfPeriods] || "Periode";
            const regulationLabels = Array.from(
              { length: match.matchSettings.numOfPeriods },
              (_, i) => `${i + 1}. ${periodName}`,
            );
            const allGroups = [
              ...regulationLabels.map((label) => ({
                label,
                items: eventGroups.find((g) => g.label === label)?.items ?? [],
              })),
              ...eventGroups.filter((g) => !regulationLabels.includes(g.label)),
            ];

            return (
              <ul className="divide-y divide-gray-200">
                {allGroups.flatMap((group) => [
                  <li
                    key={`header-${group.label}`}
                    className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {group.label}
                  </li>,
                  ...(group.items.length === 0
                    ? [
                        <li
                          key={`empty-${group.label}`}
                          className="px-4 py-4 text-sm text-gray-400 text-center italic"
                        >
                          Keine Strafen in diesem Abschnitt
                        </li>,
                      ]
                    : group.items.map((penalty, index) => (
                    <li
                      key={`${penalty.teamFlag}-${group.label}-${index}`}
                      className="flex items-center py-4 px-4 sm:px-6"
                    >
                      <div className="flex-shrink-0 w-[32px] h-[32px] sm:w-[32px] sm:h-[32px] mx-auto mr-6">
                        <CldImage
                          src={
                            penalty.teamFlag === "home"
                              ? match.home.logo
                              : match.away.logo
                          }
                          alt={
                            penalty.teamFlag === "home"
                              ? match.home.tinyName
                              : match.away.tinyName
                          }
                          width={32}
                          height={32}
                          gravity="center"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="w-10 sm:w-16 flex-shrink-0 text-sm font-medium text-gray-900 text-center">
                        <div>{penalty.matchTimeStart}</div>
                      </div>
                      <div className="flex-grow ml-6">
                        <p className="text-sm font-medium text-gray-900">
                          {penalty.teamName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {penalty.isGM && "GM · "}
                          {penalty.isMP && "MP · "}
                          {penalty.penaltyMinutes} Min. ·{" "}
                          {penalty.penaltyCode.key} -{" "}
                          {penalty.penaltyCode.value}
                        </p>
                      </div>
                    </li>
                  ))),
                ])}
              </ul>
            );
          })()}
        </div>
      </div>

      {/* Referees Section */}
      <div className="py-6 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Schiedsrichter
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center bg-white rounded-md shadow-md border divide-y divide-gray-200">
          {match.referee1 ? (
            <RefereeInfo
              assigned={true}
              referee={match.referee1}
              position={1}
            />
          ) : (
            <RefereeInfo assigned={false} position={1} />
          )}
          {match.referee2 ? (
            <RefereeInfo
              assigned={true}
              referee={match.referee2}
              position={2}
            />
          ) : (
            <RefereeInfo assigned={false} position={2} />
          )}
        </div>
      </div>

      <MatchSettingsDisplay
        matchSettings={match.matchSettings}
        matchSettingsSource={match.matchSettingsSource}
      />
    </Layout>
  );
}

