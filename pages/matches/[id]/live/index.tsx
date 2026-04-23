import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CldImage } from "next-cloudinary";
import {
  MatchValues,
  ScoresBase,
  PenaltiesBase,
} from "../../../../types/MatchValues";
import { timeToSeconds, getPeriodLabel } from "../../../../utils/matchPeriods";
import Layout from "../../../../components/Layout";
import apiClient from "../../../../lib/apiClient";
import { getErrorMessage } from "../../../../lib/errorHandler";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { tournamentConfigs } from "../../../../tools/consts";
import MatchHeader from "../../../../components/ui/MatchHeader";
import MatchStatusBadge from "../../../../components/ui/MatchStatusBadge";
import LoadingState from "../../../../components/ui/LoadingState";

const POLL_INTERVAL_MS = 15000;

interface GoalEvent extends ScoresBase {
  kind: "goal";
  timeSeconds: number;
  teamFlag: "home" | "away";
}

interface PenaltyEvent extends PenaltiesBase {
  kind: "penalty";
  timeSeconds: number;
  teamFlag: "home" | "away";
}

type FeedEvent = GoalEvent | PenaltyEvent;

export default function LiveMatch() {
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();
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

  // Initial fetch
  useEffect(() => {
    if (!router.isReady || typeof id !== "string") return;

    const fetchMatch = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await apiClient.get(`/matches/${id}`);
        applyMatchData(response.data, true);
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

  // Manual refresh (wired into MatchHeader's refresh button)
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

  // Build chronological event feed sorted newest-first
  const goals: GoalEvent[] = [
    ...(match.home.scores || []).map((g) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "home" as const,
    })),
    ...(match.away.scores || []).map((g) => ({
      ...g,
      kind: "goal" as const,
      timeSeconds: timeToSeconds(g.matchTime),
      teamFlag: "away" as const,
    })),
  ];

  const penalties: PenaltyEvent[] = [
    ...(match.home.penalties || []).map((p) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "home" as const,
    })),
    ...(match.away.penalties || []).map((p) => ({
      ...p,
      kind: "penalty" as const,
      timeSeconds: timeToSeconds(p.matchTimeStart),
      teamFlag: "away" as const,
    })),
  ];

  const feed: FeedEvent[] = [...goals, ...penalties].sort(
    (a, b) => b.timeSeconds - a.timeSeconds,
  );

  return (
    <Layout>
      {/* Back navigation */}
      <div className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-base mb-2">
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

      {/* Event feed */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Ereignisse</h3>
        <div className="bg-white rounded-md shadow-md overflow-hidden border divide-y divide-gray-100">
          {feed.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-400 text-center italic">
              Noch keine Ereignisse
            </div>
          ) : (
            feed.map((event, index) => {
              const logo =
                event.teamFlag === "home" ? match.home.logo : match.away.logo;
              const tinyName =
                event.teamFlag === "home"
                  ? match.home.tinyName
                  : match.away.tinyName;

              if (event.kind === "goal") {
                const periodLabel = getPeriodLabel(
                  event.timeSeconds,
                  match.matchSettings,
                );
                return (
                  <div
                    key={event._id ?? `goal-${index}`}
                    className="flex items-center py-3 px-4 sm:px-6 gap-x-3"
                  >
                    {/* Team logo */}
                    <div className="flex-shrink-0 w-8 h-8">
                      <CldImage
                        src={logo}
                        alt={tinyName}
                        width={32}
                        height={32}
                        gravity="center"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Time + Period */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <span className="text-sm font-semibold text-gray-800 block">
                        {event.matchTime}
                      </span>
                      <span className="text-xs text-gray-400">{periodLabel}</span>
                    </div>

                    {/* Goal badge */}
                    <div className="flex-shrink-0 text-xs font-bold text-white bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center">
                      T
                    </div>

                    {/* Player info */}
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        #{event.goalPlayer.jerseyNumber}{" "}
                        {event.goalPlayer.displayFirstName}{" "}
                        {event.goalPlayer.displayLastName}
                      </p>
                      {event.assistPlayer ? (
                        <p className="text-xs text-gray-500 truncate">
                          Assist: #{event.assistPlayer.jerseyNumber}{" "}
                          {event.assistPlayer.displayFirstName}{" "}
                          {event.assistPlayer.displayLastName}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Keine Vorlage</p>
                      )}
                    </div>

                    {/* Team label */}
                    <div className="flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {tinyName}
                      </span>
                    </div>
                  </div>
                );
              }

              // Penalty event
              const penaltyPeriodLabel = getPeriodLabel(
                event.timeSeconds,
                match.matchSettings,
              );
              const pc = event.penaltyCode as Record<string, string>;
              const pcKey = pc["key"] ?? "";
              const pcValue = pc["value"] ?? "";
              return (
                <div
                  key={event._id ?? `penalty-${index}`}
                  className="flex items-center py-3 px-4 sm:px-6 gap-x-3 bg-gray-50"
                >
                  {/* Team logo */}
                  <div className="flex-shrink-0 w-8 h-8 opacity-60">
                    <CldImage
                      src={logo}
                      alt={tinyName}
                      width={32}
                      height={32}
                      gravity="center"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Time + Period */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className="text-sm font-medium text-gray-600 block">
                      {event.matchTimeStart}
                    </span>
                    <span className="text-xs text-gray-400">
                      {penaltyPeriodLabel}
                    </span>
                  </div>

                  {/* Penalty badge */}
                  <div className="flex-shrink-0 text-xs font-bold text-white bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center">
                    S
                  </div>

                  {/* Player + penalty info */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      #{event.penaltyPlayer.jerseyNumber}{" "}
                      {event.penaltyPlayer.displayFirstName}{" "}
                      {event.penaltyPlayer.displayLastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {event.isGM && "GM · "}
                      {event.isMP && "MP · "}
                      {event.penaltyMinutes} Min. · {pcKey} – {pcValue}
                    </p>
                  </div>

                  {/* Team label */}
                  <div className="flex-shrink-0">
                    <span className="text-xs font-medium text-gray-400 uppercase">
                      {tinyName}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
