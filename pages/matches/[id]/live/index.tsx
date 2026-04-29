import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useAuth from "../../../../hooks/useAuth";
import { useRouter } from "next/router";
import { MatchValues, ScoresBase, PenaltiesBase } from "../../../../types/MatchValues";
import Layout from "../../../../components/Layout";
import apiClient from "../../../../lib/apiClient";
import { getErrorMessage } from "../../../../lib/errorHandler";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { tournamentConfigs } from "../../../../tools/consts";
import { calculateMatchButtonPermissions } from "../../../../tools/utils";
import { MatchdayOwner } from "../../../../types/TournamentValues";
import MatchHeader from "../../../../components/ui/MatchHeader";
import MatchStatusBadge from "../../../../components/ui/MatchStatusBadge";
import LoadingState from "../../../../components/ui/LoadingState";
import LiveEventFeed, { FeedEvent, GoalEvent, PenaltyEvent } from "../../../../components/ui/LiveEventFeed";
import { timeToSeconds } from "../../../../utils/matchPeriods";
import RosterTable from "../../../../components/ui/RosterTable";

const POLL_INTERVAL_MS = 15000;

const TABS = [
  { id: "ticker", name: "Ticker" },
  { id: "aufstellung", name: "Aufstellung" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LiveMatch() {
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [matchdayOwner, setMatchdayOwner] = useState<MatchdayOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ticker");
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const applyMatchData = useCallback(
    (fetchedMatch: MatchValues, isInitial = false): boolean => {
      const status = fetchedMatch.matchStatus.key;
      if (status !== "INPROGRESS") {
        router.replace(`/matches/${id}`);
        return false;
      }
      setMatch(fetchedMatch);
      setLastUpdated(new Date());
      if (isInitial) setIsLoading(false);
      return true;
    },
    [id, router],
  );

  // Sync active tab from URL query; normalize invalid values to "ticker"
  useEffect(() => {
    const { tab } = router.query;
    const valid = TABS.map((t) => t.id) as string[];
    const resolved: TabId =
      typeof tab === "string" && valid.includes(tab) ? (tab as TabId) : "ticker";
    setActiveTab(resolved);
    if (typeof tab === "string" && !valid.includes(tab)) {
      router.replace({ query: { ...router.query, tab: "ticker" } }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.tab]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push({ query: { ...router.query, tab: tabId } }, undefined, {
      shallow: true,
    });
  };

  // Initial fetch
  useEffect(() => {
    if (!router.isReady || typeof id !== "string") return;

    const fetchMatch = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await apiClient.get(`/matches/${id}`);
        const fetchedMatch: MatchValues = response.data;
        const stayed = applyMatchData(fetchedMatch, true);
        if (stayed) {
          try {
            const matchdayResponse = await apiClient.get(
              `/tournaments/${fetchedMatch.tournament.alias}/seasons/${fetchedMatch.season.alias}/rounds/${fetchedMatch.round.alias}/matchdays/${fetchedMatch.matchday.alias}`,
            );
            setMatchdayOwner(matchdayResponse.data?.owner ?? null);
          } catch {
            setMatchdayOwner(null);
          }
        }
      } catch (error) {
        console.error("Error fetching live match:", getErrorMessage(error));
        setFetchError(getErrorMessage(error));
        setIsLoading(false);
      }
    };

    fetchMatch();
  }, [router.isReady, id]);

  // Polling every 15 seconds
  useEffect(() => {
    if (!router.isReady || typeof id !== "string" || isLoading || fetchError) {
      return;
    }

    const poll = async () => {
      try {
        setIsRefreshing(true);
        const response = await apiClient.get(`/matches/${id}`);
        applyMatchData(response.data);
      } catch (error) {
        console.error("Error polling live match:", getErrorMessage(error));
      } finally {
        setIsRefreshing(false);
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router.isReady, id, isLoading, fetchError, applyMatchData]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (!id || isRefreshing) return;
    try {
      setIsRefreshing(true);
      const response = await apiClient.get(`/matches/${id}`);
      applyMatchData(response.data);
    } catch (error) {
      console.error("Error refreshing live match:", getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }, [id, isRefreshing, applyMatchData]);

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

  const numOfPeriods = match.matchSettings?.numOfPeriods ?? 1;
  const settings = match.matchSettings;

  const goals: GoalEvent[] = [
    ...(match.home.scores ?? []).map((g: ScoresBase) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "home" as const,
    })),
    ...(match.away.scores ?? []).map((g: ScoresBase) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "away" as const,
    })),
  ];

  const penalties: PenaltyEvent[] = [
    ...(match.home.penalties ?? []).map((p: PenaltiesBase) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "home" as const,
    })),
    ...(match.away.penalties ?? []).map((p: PenaltiesBase) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "away" as const,
    })),
  ];

  const feed: FeedEvent[] = [...goals, ...penalties].sort(
    (a, b) => a.timeSeconds - b.timeSeconds,
  );

  return (
    <Layout>
      {/* Back navigation */}
      <div className="flex items-center justify-between text-gray-500 hover:text-gray-700 text-sm font-base">
        <Link
          href={`/tournaments/${match.tournament.alias}`}
          aria-label="Zurück zum Turnier"
          className="flex items-center"
        >
          <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
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
        onRefresh={handleRefresh}
      />

      {/* LIVE indicator */}
      <div className="flex items-center gap-x-2 mt-6 mb-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        </span>
        <MatchStatusBadge
          statusKey={match.matchStatus.key}
          statusValue={match.matchStatus.value}
          finishTypeKey={match.finishType?.key}
          finishTypeValue={match.finishType?.value}
        />
        {isRefreshing && (
          <span className="text-xs text-gray-400 ml-1">Aktualisierung…</span>
        )}
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "ticker" && (
        <div className="mb-4">
          <LiveEventFeed feed={feed} match={match} settings={settings} />
        </div>
      )}

      {activeTab === "aufstellung" && (
        <div className="mb-8">
          <div className="hidden md:flex gap-8 mb-4">
            <div className="flex-1 text-center font-semibold text-gray-700">
              {match.home.fullName}
            </div>
            <div className="flex-1 text-center font-semibold text-gray-700">
              {match.away.fullName}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <RosterTable
                teamName={match.home.fullName}
                roster={match.home.roster?.players ?? []}
                isPublished={match.home.roster?.published ?? false}
                numOfPeriods={numOfPeriods}
              />
            </div>
            <div className="flex-1">
              <RosterTable
                teamName={match.away.fullName}
                roster={match.away.roster?.players ?? []}
                isPublished={match.away.roster?.published ?? false}
                numOfPeriods={numOfPeriods}
              />
            </div>
          </div>
        </div>
      )}

      {/* Last updated footer */}
      {lastUpdated && (
        <p className="text-xs text-gray-400 text-right mt-2 mb-8">
          Zuletzt aktualisiert:{" "}
          {lastUpdated.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          Uhr
        </p>
      )}
    </Layout>
  );
}
