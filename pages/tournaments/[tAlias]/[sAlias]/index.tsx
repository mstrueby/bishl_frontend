import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  CheckIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  HomeIcon
} from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import Layout from "../../../../components/Layout";
import apiClient from "../../../../lib/apiClient";
import {
  SeasonValues,
  RoundValues,
  MatchdayValues,
} from "../../../../types/TournamentValues";
import { MatchValues } from "../../../../types/MatchValues";
import MatchCard from "../../../../components/ui/MatchCard";
import Standings from "../../../../components/ui/Standings";
import { classNames } from "../../../../tools/utils";

interface SeasonHubProps {
  season: SeasonValues;
  allSeasons: SeasonValues[];
  allRounds: RoundValues[];
  liveAndUpcomingMatches: MatchValues[];
  selectedRoundMatches: MatchValues[];
  selectedMatchdayMatches: MatchValues[];
  selectedRoundMatchdays: MatchdayValues[];
  selectedMatchday?: MatchdayValues | null;
  tAlias: string;
  sAlias: string;
  rAlias?: string;
  mdAlias?: string;
  tournamentName: string;
  roundName?: string;
  matchdayName?: string;
}

export default function SeasonHub({
  season,
  allSeasons,
  allRounds,
  liveAndUpcomingMatches,
  selectedRoundMatches,
  selectedMatchdayMatches,
  selectedRoundMatchdays,
  selectedMatchday,
  tAlias,
  sAlias,
  rAlias,
  mdAlias,
  tournamentName,
  roundName,
  matchdayName,
}: SeasonHubProps) {
  const router = useRouter();
  const [selectedRound, setSelectedRound] = useState<string>(rAlias || "");
  const [selectedMatchdayAlias, setSelectedMatchdayAlias] = useState<string>(
    mdAlias || "",
  );
  const [matchdaysForRound, setMatchdaysForRound] = useState<MatchdayValues[]>(
    selectedRoundMatchdays,
  );

  // Tab state for matches view
  const [activeMatchTab, setActiveMatchTab] = useState<string>("");

  // Update local state when route changes
  useEffect(() => {
    setSelectedRound(rAlias || "");
    setSelectedMatchdayAlias(mdAlias || "");
  }, [rAlias, mdAlias]);

  // Fetch matchdays when round changes
  useEffect(() => {
    const fetchMatchdaysForRound = async () => {
      if (selectedRound) {
        try {
          const response = await apiClient.get(
            `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${selectedRound}/matchdays`,
          );
          setMatchdaysForRound(response.data || []);
        } catch (error) {
          console.error("Error fetching matchdays for round:", error);
          setMatchdaysForRound([]);
        }
      } else {
        setMatchdaysForRound([]);
      }
    };

    fetchMatchdaysForRound();
  }, [selectedRound, tAlias, sAlias]);

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${e.target.value}`);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    if (newRound) {
      router.push(`/tournaments/${tAlias}/${sAlias}/${newRound}`);
    } else {
      router.push(`/tournaments/${tAlias}/${sAlias}`);
    }
  };

  const handleMatchdayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMatchday = e.target.value;
    if (newMatchday && selectedRound) {
      router.push(
        `/tournaments/${tAlias}/${sAlias}/${selectedRound}/${newMatchday}`,
      );
    } else if (selectedRound) {
      router.push(`/tournaments/${tAlias}/${sAlias}/${selectedRound}`);
    }
  };

  // Determine which matches to display
  const displayMatches = mdAlias
    ? selectedMatchdayMatches
    : rAlias
      ? selectedRoundMatches
      : [];

  // Build page title
  const titleParts = [tournamentName, season.name];
  if (roundName) titleParts.push(roundName);
  if (matchdayName) titleParts.push(matchdayName);
  const pageTitle = titleParts.join(" - ") + " | BISHL";

  // Build context header
  const contextHeader = matchdayName
    ? `${tournamentName} ${season.name} – ${roundName}`
    : roundName
      ? `${tournamentName} ${season.name} – ${roundName}`
      : `${tournamentName} ${season.name}`;
  const contextDescription = matchdayName
    ? `${matchdayName}`
    : roundName
      ? `Spielplan und Tabelle`
      : `Spielplan`;

  // Determine if this is the current season (for canonical URL)
  const isCurrentSeason =
    allSeasons.length > 0 && allSeasons[0].alias === sAlias;

  // Set canonical URL to tournament root if this is the current season and no round/matchday selected
  const canonicalUrl =
    !rAlias && !mdAlias && isCurrentSeason
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}${rAlias ? `/${rAlias}` : ""}${mdAlias ? `/${mdAlias}` : ""}`;

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`${contextHeader}. Spielplan, Ergebnisse und Tabelle.`}
        />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex mb-8">
        <ol role="list" className="flex items-center space-x-4">
          <li>
            <div>
              <Link
                href="/"
                className="text-sm font-medium text-gray-400 hover:text-gray-500"
              >
                <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
              <Link
                href="/tournaments"
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Wettbewerbe
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
              <Link
                href={`/tournaments/${tAlias}`}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {tournamentName}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
              <span
                className={`ml-4 text-sm font-medium text-gray-500 ${rAlias ? "hover:text-gray-700" : ""}`}
              >
                {!rAlias ? (
                  season.name
                ) : (
                  <Link href={`/tournaments/${tAlias}/${sAlias}`}>
                    {season.name}
                  </Link>
                )}
              </span>
            </div>
          </li>
          {roundName && (
            <li>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                <span
                  className={`ml-4 text-sm font-medium text-gray-500 ${mdAlias ? "hover:text-gray-700" : ""}`}
                >
                  {!mdAlias ? (
                    roundName
                  ) : (
                    <Link href={`/tournaments/${tAlias}/${sAlias}/${rAlias}`}>
                      {roundName}
                    </Link>
                  )}
                </span>
              </div>
            </li>
          )}
          {matchdayName && (
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-500">
                  {matchdayName}
                </span>
              </div>
            </li>
          )}
        </ol>
      </nav>

      {/* Header with Season Selector */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {contextHeader}
          </h1>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-md text-gray-500">
              <p>{contextDescription}</p>
            </div>
          </div>
        </div>

        {/* Drop-Down SEASON */}
        {allSeasons.length > 1 && !rAlias && (
          <Listbox
            value={season.alias}
            onChange={(selectedAlias) => {
              router.push(`/tournaments/${tAlias}/${selectedAlias}`);
            }}
          >
            {({ open }) => (
              <>
                <Listbox.Label className="sr-only">Change Season</Listbox.Label>
                <div>
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    <span className="block truncate">{season.name}</span>
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
                    <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-28 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {allSeasons.map((s) => (
                        <Listbox.Option
                          key={s.alias}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-indigo-600 text-white"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9",
                            )
                          }
                          value={s.alias}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate",
                                )}
                              >
                                {s.name}
                              </span>

                              {selected ? (
                                <span
                                  className={classNames(
                                    active ? "text-white" : "text-indigo-600",
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
        )}
      </div>

      {/* Cascading Filters Bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 sticky top-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Round Selector */}
          <div>
            <label
              htmlFor="round-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Runde
            </label>
            <select
              id="round-select"
              value={selectedRound}
              onChange={handleRoundChange}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Runden</option>
              {allRounds.map((round) => (
                <option key={round.alias} value={round.alias}>
                  {round.name}
                </option>
              ))}
            </select>
          </div>

          {/* Matchday Selector - Only shown when round has multiple matchdays */}
          <div>
            <label
              htmlFor="matchday-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Spieltag
            </label>
            {!selectedRound ? (
              <div className="block w-full rounded-md border border-gray-300 bg-gray-100 py-2 pl-3 pr-10 text-base text-gray-400 sm:text-sm">
                Alle Spieltage
              </div>
            ) : matchdaysForRound.length === 1 ? (
              <div className="block w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-3 pr-10 text-base text-gray-900 sm:text-sm">
                {matchdaysForRound[0].alias === "all_games"
                  ? "Alle Spiele"
                  : matchdaysForRound[0].name}
              </div>
            ) : (
              <select
                id="matchday-select"
                value={selectedMatchdayAlias}
                onChange={handleMatchdayChange}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Alle Spieltage</option>
                {matchdaysForRound.map((md) => (
                  <option key={md.alias} value={md.alias}>
                    {md.alias === "ALL_GAMES" ? "Alle Spiele" : md.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Live & Upcoming Matches or Matches Display */}
      {!rAlias && liveAndUpcomingMatches.length > 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Spiele</h2>

          {(() => {
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const pastMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(
                matchDate.getFullYear(),
                matchDate.getMonth(),
                matchDate.getDate(),
              );
              return matchDay < today;
            });

            const todayMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(
                matchDate.getFullYear(),
                matchDate.getMonth(),
                matchDate.getDate(),
              );
              return matchDay.getTime() === today.getTime();
            });

            const nextMatches = liveAndUpcomingMatches.filter((match) => {
              const matchDate = new Date(match.startDate);
              const matchDay = new Date(
                matchDate.getFullYear(),
                matchDate.getMonth(),
                matchDate.getDate(),
              );
              return matchDay >= tomorrow;
            });

            const tabs = [
              { key: "past", label: "Vergangene", matches: pastMatches },
              { key: "today", label: "Heute", matches: todayMatches },
              { key: "next", label: "Kommende", matches: nextMatches },
            ].filter((tab) => tab.matches.length > 0);

            // Set default tab on first render
            const defaultTab =
              todayMatches.length > 0
                ? "today"
                : nextMatches.length > 0
                  ? "next"
                  : tabs[0]?.key || "today";
            if (!activeMatchTab && tabs.length > 0) {
              setActiveMatchTab(defaultTab);
            }

            const currentTab = activeMatchTab || defaultTab;
            const activeMatches =
              tabs.find((tab) => tab.key === currentTab)?.matches || [];

            return (
              <>
                {tabs.length > 1 && (
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveMatchTab(tab.key)}
                          className={`
                            ${
                              currentTab === tab.key
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                          `}
                        >
                          {tab.label} ({tab.matches.length})
                        </button>
                      ))}
                    </nav>
                  </div>
                )}

                <div className="space-y-4">
                  {activeMatches.map((match) => (
                    <MatchCard
                      key={match._id || match.matchId}
                      match={match}
                      from={`/tournaments/${tAlias}/${sAlias}`}
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      ) : displayMatches.length > 0 ? (
        <>
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Spiele
            </h2>
            <div className="space-y-4">
              {displayMatches.map((match) => (
                <MatchCard
                  key={match._id || match.matchId}
                  match={match}
                  from={`/tournaments/${tAlias}/${sAlias}${rAlias ? `/${rAlias}` : ""}${mdAlias ? `/${mdAlias}` : ""}`}
                />
              ))}
            </div>
          </div>

          {mdAlias &&
            selectedMatchday?.createStandings &&
            selectedMatchday?.standings && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Tabelle
                </h2>
                <Standings
                  standingsData={selectedMatchday.standings}
                  matchSettings={selectedMatchday.matchSettings}
                />
              </div>
            )}
        </>
      ) : rAlias ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            {mdAlias
              ? "Keine Spiele für diesen Spieltag"
              : "Keine Spiele für diese Runde"}
          </p>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-700 mb-2">
            Wähle eine Runde, um Spiele anzuzeigen
          </p>
          <p className="text-sm text-gray-500">
            Verwende die Filter oben, um Spiele zu durchsuchen
          </p>
        </div>
      )}
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { tAlias, sAlias, rAlias, mdAlias } = params as {
    tAlias: string;
    sAlias: string;
    rAlias?: string;
    mdAlias?: string;
  };

  try {
    // Fetch season data
    const [seasonResponse, allSeasonsResponse, tournamentResponse] =
      await Promise.all([
        apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`),
        apiClient.get(`/tournaments/${tAlias}/seasons`),
        apiClient.get(`/tournaments/${tAlias}`),
      ]);

    const season = seasonResponse.data;
    const allSeasons = allSeasonsResponse.data || [];
    const tournament = tournamentResponse.data;

    // Fetch all rounds for this season
    const allRoundsResponse = await apiClient.get(
      `/tournaments/${tAlias}/seasons/${sAlias}/rounds`,
    );
    const allRounds = allRoundsResponse.data || [];

    // Fetch matchdays only if a round is selected
    let selectedRoundMatchdays: MatchdayValues[] = [];
    if (rAlias) {
      try {
        const matchdaysResponse = await apiClient.get(
          `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays`,
        );
        selectedRoundMatchdays = matchdaysResponse.data || [];
      } catch (error) {
        console.error(`Error fetching matchdays for round ${rAlias}:`, error);
      }
    }

    // Fetch live and upcoming matches for the season (only if no round selected)
    let liveAndUpcomingMatches: MatchValues[] = [];
    if (!rAlias) {
      try {
        const matchesResponse = await apiClient.get(
          `/matches?tournament=${tAlias}&season=${sAlias}&status=live,upcoming&limit=10`,
        );
        liveAndUpcomingMatches = matchesResponse.data || [];
      } catch (error) {
        console.error("Error fetching live/upcoming matches:", error);
      }
    }

    // Fetch matches for selected round
    let selectedRoundMatches: MatchValues[] = [];
    if (rAlias && !mdAlias) {
      try {
        const matchesResponse = await apiClient.get(
          `/matches?tournament=${tAlias}&season=${sAlias}&round=${rAlias}`,
        );
        selectedRoundMatches = matchesResponse.data || [];
      } catch (error) {
        console.error("Error fetching round matches:", error);
      }
    }

    // Fetch matches for selected matchday
    let selectedMatchdayMatches: MatchValues[] = [];
    let selectedMatchday: MatchdayValues | null = null;
    let roundName: string | undefined;
    let matchdayName: string | undefined;

    if (rAlias && mdAlias) {
      try {
        const [matchesResponse, roundResponse, matchdayResponse] =
          await Promise.all([
            apiClient.get(
              `/matches?tournament=${tAlias}&season=${sAlias}&round=${rAlias}&matchday=${mdAlias}`,
            ),
            apiClient.get(
              `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`,
            ),
            apiClient.get(
              `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}`,
            ),
          ]);
        selectedMatchdayMatches = matchesResponse.data || [];
        selectedMatchday = matchdayResponse.data || null;
        roundName = roundResponse.data?.name;
        matchdayName = matchdayResponse.data?.name;
      } catch (error) {
        console.error("Error fetching matchday data:", error);
      }
    } else if (rAlias) {
      try {
        const roundResponse = await apiClient.get(
          `/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`,
        );
        roundName = roundResponse.data?.name;
      } catch (error) {
        console.error("Error fetching round data:", error);
      }
    }

    return {
      props: {
        season,
        allSeasons: allSeasons
          //.filter((s: SeasonValues) => s.published)
          .sort((a: SeasonValues, b: SeasonValues) =>
            b.alias.localeCompare(a.alias),
          ),
        allRounds: allRounds
          .filter((r: RoundValues) => r.published)
          .sort((a: RoundValues, b: RoundValues) => {
            if (a.startDate && b.startDate) {
              return (
                new Date(a.startDate).getTime() -
                new Date(b.startDate).getTime()
              );
            }
            return a.alias.localeCompare(b.alias);
          }),
        liveAndUpcomingMatches,
        selectedRoundMatches,
        selectedMatchdayMatches,
        selectedRoundMatchdays: selectedRoundMatchdays
          .filter((md: MatchdayValues) => md.published)
          .sort((a: MatchdayValues, b: MatchdayValues) => {
            if (a.startDate && b.startDate) {
              return (
                new Date(a.startDate).getTime() -
                new Date(b.startDate).getTime()
              );
            }
            return a.alias.localeCompare(b.alias);
          }),
        selectedMatchday,
        tAlias,
        sAlias,
        rAlias: rAlias || null,
        mdAlias: mdAlias || null,
        tournamentName: tournament?.name || tAlias,
        roundName: roundName || null,
        matchdayName: matchdayName || null,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Failed to fetch season hub data:", error);
    return { notFound: true };
  }
};
