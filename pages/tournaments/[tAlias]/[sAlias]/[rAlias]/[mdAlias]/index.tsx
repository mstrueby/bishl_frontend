
import { GetStaticPropsContext } from "next";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { CheckIcon } from "@heroicons/react/20/solid";
import Layout from "../../../../../../components/Layout";
import { MatchdayValues, SeasonValues, RoundValues } from "../../../../../../types/TournamentValues";
import { MatchValues } from "../../../../../../types/MatchValues";
import MatchCard from "../../../../../../components/ui/MatchCard";
import Standings from "../../../../../../components/ui/Standings";
import apiClient from "../../../../../../lib/apiClient";

interface MatchdayDetailProps {
  matchday: MatchdayValues;
  allMatchdays: MatchdayValues[];
  allSeasons: SeasonValues[];
  allRounds: RoundValues[];
  matches: MatchValues[];
  tAlias: string;
  sAlias: string;
  rAlias: string;
  mdAlias: string;
  tournamentName: string;
  seasonName: string;
  roundName: string;
}

type TabKey = "matches" | "standings";

export default function MatchdayDetail({
  matchday,
  allMatchdays,
  allSeasons,
  allRounds,
  matches,
  tAlias,
  sAlias,
  rAlias,
  mdAlias,
  tournamentName,
  seasonName,
  roundName,
}: MatchdayDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("matches");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Sort matches by start time
  const sortedMatches = matches
    ? matches
        .slice()
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
    : [];

  // Get unique teams for filter
  const teams = Array.from(
    new Set(
      sortedMatches.flatMap((m) => [
        m.home.shortName,
        m.away.shortName,
      ])
    )
  ).sort();

  // Filter matches by selected team
  const filteredMatches = selectedTeam
    ? sortedMatches.filter(
        (m) =>
          m.home.shortName === selectedTeam ||
          m.away.shortName === selectedTeam
      )
    : sortedMatches;

  // Group matches by date
  const matchesByDate = filteredMatches.reduce(
    (acc, match) => {
      const dateKey = new Date(match.startDate).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(match);
      return acc;
    },
    {} as Record<string, typeof sortedMatches>,
  );

  const showTabs = matchday.createStandings;

  const tabs = showTabs
    ? [
        { key: "matches" as TabKey, caption: "Spiele" },
        { key: "standings" as TabKey, caption: "Tabelle" },
      ]
    : [];

  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(" ");
  }

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${e.target.value}`);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${sAlias}/${e.target.value}`);
  };

  const handleMatchdayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${sAlias}/${rAlias}/${e.target.value}`);
  };

  return (
    <Layout>
      <Head>
        <title>
          {matchday.name} - {roundName} - {seasonName} - {tournamentName} |
          BISHL
        </title>
        <meta
          name="description"
          content={`${matchday.name} im ${roundName} der Saison ${seasonName} (${tournamentName}). Spiele, Tabelle und Statistiken.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`}
        />
      </Head>

      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tournaments" className="hover:text-gray-700">
              Wettbewerbe
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/tournaments/${tAlias}`}
              className="hover:text-gray-700"
            >
              {tournamentName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/tournaments/${tAlias}/${sAlias}`}
              className="hover:text-gray-700"
            >
              {seasonName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/tournaments/${tAlias}/${sAlias}/${rAlias}`}
              className="hover:text-gray-700"
            >
              {roundName}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-900" aria-current="page">
            {matchday.name}
          </li>
        </ol>
      </nav>

      {/* Header with Season, Round, and Matchday Selectors */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {matchday.name}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {roundName} · {seasonName} · {tournamentName}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex gap-2">
          {allSeasons.length > 1 && (
            <div>
              <select
                value={sAlias}
                onChange={handleSeasonChange}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {allSeasons.map((season) => (
                  <option key={season.alias} value={season.alias}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {allRounds.length > 1 && (
            <div>
              <select
                value={rAlias}
                onChange={handleRoundChange}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {allRounds.map((round) => (
                  <option key={round.alias} value={round.alias}>
                    {round.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {allMatchdays.length > 1 && (
            <div>
              <select
                value={mdAlias}
                onChange={handleMatchdayChange}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {allMatchdays.map((md) => (
                  <option key={md.alias} value={md.alias}>
                    {md.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Matchday Details */}
      <div className="border-b border-gray-200 pb-6">
        {/* Matchday Type */}
        {matchday.type && (
          <p className="text-sm text-gray-500">{matchday.type.value}</p>
        )}

        {/* Matchday Dates */}
        {(matchday.startDate || matchday.endDate) && (
          <p className="mt-2 text-sm text-gray-500">
            {matchday.startDate &&
              new Date(matchday.startDate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            {matchday.startDate && matchday.endDate && " - "}
            {matchday.endDate &&
              new Date(matchday.endDate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
          </p>
        )}

        {/* Owner (for tournament-style matchdays) */}
        {matchday.owner && (
          <p className="mt-2 text-sm text-gray-600">
            Austragungsort: {matchday.owner.clubName}
          </p>
        )}

        {matchday.published && (
          <span className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Veröffentlicht
          </span>
        )}
      </div>

      {/* Tabs (only if standings exist) */}
      {showTabs && (
        <div className="mt-8">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Wähle einen Tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabKey)}
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.caption}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav
              className="flex space-x-4 border-b border-gray-200"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={classNames(
                    tab.key === activeTab
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium",
                  )}
                  aria-current={tab.key === activeTab ? "page" : undefined}
                >
                  {tab.caption}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-8">
        {/* Matches Tab (or standalone if no tabs) */}
        {(!showTabs || activeTab === "matches") && (
          <section>
            {/* Team Filter */}
            {teams.length > 0 && (
              <div className="mb-6">
                <label
                  htmlFor="team-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nach Team filtern
                </label>
                <select
                  id="team-filter"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="block w-full max-w-xs rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Alle Teams</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  {selectedTeam
                    ? "Keine Spiele für dieses Team"
                    : "Keine Spiele verfügbar"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(matchesByDate).map(([date, matches]) => (
                  <div key={date}>
                    {/* Date Header (only if multiple dates) */}
                    {Object.keys(matchesByDate).length > 1 && (
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {date}
                      </h2>
                    )}

                    {/* Match Cards */}
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <MatchCard
                          key={match._id || match.matchId}
                          match={match}
                          onMatchUpdated={() => {
                            // Optional: Add refetch logic here if needed
                          }}
                          from={`/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Standings Tab */}
        {showTabs && activeTab === "standings" && (
          <section>
            {matchday.createStandings && matchday.standings ? (
              <Standings
                standingsData={matchday.standings}
                matchSettings={matchday.matchSettings}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Keine Tabelle verfügbar</p>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;
  const mdAlias = context.params?.mdAlias;

  if (
    typeof tAlias !== "string" ||
    typeof sAlias !== "string" ||
    typeof rAlias !== "string" ||
    typeof mdAlias !== "string"
  ) {
    return { notFound: true };
  }

  try {
    // Fetch matchday data using apiClient
    const matchdayResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}`,
    );
    const matchdayData = matchdayResponse.data;

    // Fetch all seasons for the dropdown
    const allSeasonsResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons`,
    );
    const allSeasons = allSeasonsResponse.data || [];

    // Fetch all rounds for the dropdown
    const allRoundsResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons/${sAlias}/rounds`,
    );
    const allRounds = allRoundsResponse.data || [];

    // Fetch all matchdays for the dropdown
    const allMatchdaysResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays`,
    );
    const allMatchdays = allMatchdaysResponse.data || [];

    // Fetch matches for this matchday using apiClient
    let matches: MatchValues[] = [];
    try {
      const matchesResponse = await apiClient.get(
        `/matches?tournament=${tAlias}&season=${sAlias}&round=${rAlias}&matchday=${mdAlias}`,
      );
      matches = matchesResponse.data || [];
    } catch (error) {
      console.error("Error fetching matches:", error);
      // Continue without matches
    }

    // Fetch round data for breadcrumb using apiClient
    let roundName = rAlias;
    try {
      const roundResponse = await apiClient.get(
        `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`,
      );
      roundName = roundResponse.data?.name || rAlias;
    } catch (error) {
      console.error("Error fetching round:", error);
    }

    // Fetch season data for breadcrumb using apiClient
    let seasonName = sAlias;
    try {
      const seasonResponse = await apiClient.get(
        `/tournaments/${tAlias}/seasons/${sAlias}`,
      );
      seasonName = seasonResponse.data?.name || sAlias;
    } catch (error) {
      console.error("Error fetching season:", error);
    }

    // Fetch tournament data for breadcrumb using apiClient
    let tournamentName = tAlias;
    try {
      const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
      tournamentName = tournamentResponse.data?.name || tAlias;
    } catch (error) {
      console.error("Error fetching tournament:", error);
    }

    return {
      props: {
        matchday: matchdayData,
        allSeasons: allSeasons
          //.filter((s: SeasonValues) => s.published)
          .sort((a: SeasonValues, b: SeasonValues) => b.alias.localeCompare(a.alias)),
        allRounds: allRounds
          //.filter((r: RoundValues) => r.published)
          .sort((a: RoundValues, b: RoundValues) => {
            if (a.startDate && b.startDate) {
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            }
            return a.alias.localeCompare(b.alias);
          }),
        allMatchdays: allMatchdays
          //.filter((md: MatchdayValues) => md.published)
          .sort((a: MatchdayValues, b: MatchdayValues) => {
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return b.alias.localeCompare(a.alias);
          }),
        matches,
        tAlias,
        sAlias,
        rAlias,
        mdAlias,
        tournamentName,
        seasonName,
        roundName,
      },
      revalidate: 60, // 1 minute for live matches
    };
  } catch (error) {
    console.error("Failed to fetch matchday data:", error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const tournamentsResponse = await apiClient.get("/tournaments");
    const tournaments = tournamentsResponse.data || [];

    let paths: {
      params: {
        tAlias: string;
        sAlias: string;
        rAlias: string;
        mdAlias: string;
      };
    }[] = [];

    for (const tournament of tournaments) {
      try {
        const seasonsResponse = await apiClient.get(
          `/tournaments/${tournament.alias}/seasons`,
        );
        const seasons = seasonsResponse.data || [];

        for (const season of seasons) {
          try {
            const roundsResponse = await apiClient.get(
              `/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`,
            );
            const rounds = roundsResponse.data || [];

            for (const round of rounds) {
              try {
                const matchdaysResponse = await apiClient.get(
                  `/tournaments/${tournament.alias}/seasons/${season.alias}/rounds/${round.alias}/matchdays`,
                );
                const matchdays = matchdaysResponse.data || [];

                const matchdayPaths = matchdays.map((matchday: any) => ({
                  params: {
                    tAlias: tournament.alias,
                    sAlias: season.alias,
                    rAlias: round.alias,
                    mdAlias: matchday.alias,
                  },
                }));

                paths = paths.concat(matchdayPaths);
              } catch (error) {
                console.error(
                  `Error fetching matchdays for ${tournament.alias}/${season.alias}/${round.alias}:`,
                  error,
                );
                // Continue with other rounds
              }
            }
          } catch (error) {
            console.error(
              `Error fetching rounds for ${tournament.alias}/${season.alias}:`,
              error,
            );
            // Continue with other seasons
          }
        }
      } catch (error) {
        console.error(`Error fetching seasons for ${tournament.alias}:`, error);
        // Continue with other tournaments
      }
    }

    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error("Failed to generate static paths:", error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}
