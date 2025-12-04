
import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import { useMemo, Fragment, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  HomeIcon,
} from "@heroicons/react/20/solid";
import { Listbox, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Layout from "../../../../components/Layout";
import apiClient from "../../../../lib/apiClient";
import {
  SeasonValues,
  RoundValues,
  MatchdayValues,
} from "../../../../types/TournamentValues";
import { MatchValues } from "../../../../types/MatchValues";
import MatchList from "../../../../components/ui/MatchList";
import Standings from "../../../../components/ui/Standings";
import { classNames } from "../../../../tools/utils";
import { MatchRefreshProvider } from "../../../../context/MatchRefreshContext";
import { mutate } from "swr";

interface SeasonHubProps {
  season: SeasonValues;
  allSeasons: SeasonValues[];
  allRounds: RoundValues[];
  selectedSeasonMatches: MatchValues[];
  selectedRoundMatches: MatchValues[];
  selectedMatchdayMatches: MatchValues[];
  selectedRoundMatchdays: MatchdayValues[];
  selectedMatchday?: MatchdayValues | null;
  matchdayOwner?: {
    clubId: string;
    clubName: string;
    clubAlias: string;
  } | null;
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
  selectedSeasonMatches,
  selectedRoundMatches,
  selectedMatchdayMatches,
  selectedRoundMatchdays,
  selectedMatchday,
  matchdayOwner,
  tAlias,
  sAlias,
  rAlias,
  mdAlias,
  tournamentName,
  roundName,
  matchdayName,
}: SeasonHubProps) {
  const router = useRouter();
  
  // Determine page context/mode directly from URL params
  const pageMode: "SEASON" | "ROUND" | "MATCHDAY" = mdAlias
    ? "MATCHDAY"
    : rAlias
      ? "ROUND"
      : "SEASON";

  // Find current round from URL (derived state)
  const currentRound = useMemo(
    () => (rAlias ? allRounds.find((r) => r.alias === rAlias) || null : null),
    [rAlias, allRounds]
  );

  // Derive sorted matchdays from props
  const matchdaysForRound = useMemo(() => {
    return selectedRoundMatchdays
      .filter((md: MatchdayValues) => md.published)
      .sort((a: MatchdayValues, b: MatchdayValues) => {
        if (a.startDate && b.startDate) {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }
        return a.alias.localeCompare(b.alias);
      });
  }, [selectedRoundMatchdays]);

  // Derive display matches from props based on page mode
  const displayMatches = useMemo((): MatchValues[] => {
    switch (pageMode) {
      case "MATCHDAY":
        return selectedMatchdayMatches;
      case "ROUND":
        return selectedRoundMatches;
      default:
        return selectedSeasonMatches;
    }
  }, [pageMode, selectedMatchdayMatches, selectedRoundMatches, selectedSeasonMatches]);

  // Track in-progress matches for centralized refresh
  const inProgressMatchIds = useMemo(() => {
    return displayMatches
      .filter(match => match?.matchStatus?.key === "INPROGRESS")
      .map(match => match._id)
      .filter(Boolean) as string[];
  }, [displayMatches]);

  // Memoized callback for match updates
  const handleMatchUpdate = useCallback(async () => {
    // Trigger revalidation of the page data
    await mutate(`/tournaments/${tAlias}/${sAlias}${rAlias ? `/${rAlias}` : ""}${mdAlias ? `/${mdAlias}` : ""}`);
  }, [tAlias, sAlias, rAlias, mdAlias]);

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/tournaments/${tAlias}/${e.target.value}`);
  };

  const handleMatchdayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMatchday = e.target.value;
    if (newMatchday && currentRound?.alias) {
      router.push(
        `/tournaments/${tAlias}/${sAlias}/${currentRound.alias}/${newMatchday}`,
      );
    } else if (currentRound?.alias) {
      router.push(`/tournaments/${tAlias}/${sAlias}/${currentRound.alias}`);
    }
  };

  // Helper function to format date range
  const formatDate = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "";

    if (startDate && endDate) {
      const dateFrom = new Date(startDate);
      const dateTo = new Date(endDate);
      return (
        `${format(dateFrom, "d. LLL", { locale: de })}` +
        `${dateTo.getDate() !== dateFrom.getDate() ? " - " + format(dateTo, "d. LLL", { locale: de }) : ""}`
      );
    }

    return startDate
      ? format(new Date(startDate), "d. LLL", { locale: de })
      : endDate
        ? format(new Date(endDate), "d. LLL", { locale: de })
        : "";
  };

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
      <nav
        aria-label="Breadcrumb"
        className="mb-8 overflow-x-auto scrollbar-hide"
      >
        <ol
          role="list"
          className="flex items-center space-x-2 sm:space-x-4 min-w-max"
        >
          <li className="flex-shrink-0">
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
          <li className="flex-shrink-0">
            <div className="flex items-center">
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-gray-400"
              />
              <Link
                href="/tournaments"
                className="ml-2 sm:ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
              >
                Wettbewerbe
              </Link>
            </div>
          </li>
          <li className="flex-shrink-0">
            <div className="flex items-center">
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-gray-400"
              />
              <Link
                href={`/tournaments/${tAlias}`}
                className="ml-2 sm:ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 truncate max-w-[120px] sm:max-w-none"
                title={tournamentName}
              >
                {tournamentName}
              </Link>
            </div>
          </li>
          <li className="flex-shrink-0">
            <div className="flex items-center">
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-gray-400"
              />
              <span
                className={`ml-2 sm:ml-4 text-sm font-medium text-gray-500 ${rAlias ? "hover:text-gray-700" : ""} whitespace-nowrap`}
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
            <li className="flex-shrink-0">
              <div className="flex items-center">
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray-400"
                />
                <span
                  className={`ml-2 sm:ml-4 text-sm font-medium text-gray-500 ${mdAlias ? "hover:text-gray-700" : ""} truncate max-w-[120px] sm:max-w-none`}
                  title={roundName}
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
            <li aria-current="page" className="flex-shrink-0">
              <div className="flex items-center">
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray-400"
                />
                <span
                  className="ml-2 sm:ml-4 text-sm font-medium text-gray-500 truncate max-w-[120px] sm:max-w-none"
                  title={matchdayName}
                >
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
                  <Listbox.Button className="grid w-28 cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6">
                    <span className="col-start-1 row-start-1 truncate pr-6">
                      {season.name}
                    </span>
                    <ChevronUpDownIcon
                      className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
                      aria-hidden="true"
                    />
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-28 overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-1 outline-black/5 data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm">
                      {allSeasons.map((s) => (
                        <Listbox.Option
                          key={s.alias}
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-indigo-600 text-white"
                                : "text-gray-900",
                              "group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-none dark:text-white dark:data-[focus]:bg-indigo-500",
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

      {/* Cascading Filters Bar for ROUND, MATCHDAY */}
      <div className="py-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Round Selector */}
          <div>
            <Listbox
              value={currentRound}
              onChange={(round: RoundValues | null) => {
                if (round?.alias) {
                  router.push(
                    `/tournaments/${tAlias}/${sAlias}/${round.alias}`,
                  );
                } else {
                  router.push(`/tournaments/${tAlias}/${sAlias}`);
                }
              }}
            >
              {({ open }) => (
                <>
                  <Listbox.Label className="sr-only">
                    Runde auswählen
                  </Listbox.Label>
                  <div className="relative">
                    <div className="inline-flex w-full divide-x divide-indigo-700 rounded-md shadow-sm">
                      <div className="inline-flex flex-1 items-center gap-x-1.5 rounded-l-md bg-indigo-600 px-3 py-2 shadow-sm">
                        <p className="text-sm font-semibold text-white uppercase truncate">
                          {currentRound?.name || "Alle Runden"}
                        </p>
                      </div>
                      <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md bg-indigo-600 p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-gray-50">
                        <ChevronDownIcon
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </Listbox.Button>
                    </div>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute left-0 z-10 mt-2 w-full origin-top-left divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Listbox.Option
                          key="all-rounds"
                          className={({ active }) =>
                            classNames(
                              active
                                ? "bg-indigo-600 text-white"
                                : "text-gray-900",
                              "cursor-default select-none p-4 text-xs sm:text-sm uppercase",
                            )
                          }
                          value={null}
                        >
                          {({ selected, active }) => (
                            <div className="flex flex-col">
                              <div className="flex justify-between text-xs sm:text-sm ">
                                <p
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    active ? "text-white" : "text-gray-900",
                                  )}
                                >
                                  Alle Runden
                                </p>
                                {selected ? (
                                  <span
                                    className={
                                      active ? "text-white" : "text-indigo-600"
                                    }
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </Listbox.Option>
                        {allRounds.map((round) => (
                          <Listbox.Option
                            key={round.alias}
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-indigo-600 text-white"
                                  : "text-gray-900",
                                "cursor-default select-none p-4 text-xs sm:text-sm uppercase",
                              )
                            }
                            value={round}
                          >
                            {({ selected, active }) => (
                              <div className="flex flex-col">
                                <div className="flex justify-between">
                                  <p
                                    className={classNames(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      active ? "text-white" : "text-gray-900",
                                    )}
                                  >
                                    {round.name}
                                  </p>
                                  {selected ? (
                                    <span
                                      className={
                                        active
                                          ? "text-white"
                                          : "text-indigo-600"
                                      }
                                    >
                                      <CheckIcon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  ) : null}
                                </div>
                                {(round.startDate || round.endDate) && (
                                  <p
                                    className={classNames(
                                      active
                                        ? "text-indigo-200"
                                        : "text-gray-500",
                                      "mt-1 text-[10px] sm:text-xs",
                                    )}
                                  >
                                    {formatDate(round.startDate, round.endDate)}
                                  </p>
                                )}
                              </div>
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
          {/* Matchday Selector - Only shown when round has multiple matchdays */}
          <div>
            {!currentRound?.alias ? (
              <div className="block w-full rounded-md border border-gray-300 bg-gray-100 py-2 pl-3 pr-10 text-base text-gray-400 sm:text-sm">
                Alle Spieltage
              </div>
            ) : matchdaysForRound.length === 1 ? (
              <div className="block w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-3 pr-10 text-base text-gray-900 sm:text-sm">
                {matchdaysForRound[0].alias === "all_games" ? (
                  <span className="text-gray-500">Alle Spiele</span>
                ) : (
                  matchdaysForRound[0].name
                )}
              </div>
            ) : (
              <Listbox
                value={
                  matchdaysForRound.find(
                    (md) => md.alias === mdAlias,
                  ) || null
                }
                onChange={(matchday: MatchdayValues | null) => {
                  if (matchday?.alias && currentRound?.alias) {
                    router.push(
                      `/tournaments/${tAlias}/${sAlias}/${currentRound.alias}/${matchday.alias}`,
                    );
                  } else if (currentRound?.alias) {
                    router.push(
                      `/tournaments/${tAlias}/${sAlias}/${currentRound.alias}`,
                    );
                  }
                }}
              >
                {({ open }) => (
                  <>
                    <Listbox.Label className="sr-only">
                      Spieltag auswählen
                    </Listbox.Label>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-indigo-600 py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:leading-6">
                        <span className="text-sm inline-flex w-full truncate">
                          <span className="truncate uppercase font-semibold">
                            {mdAlias
                              ? matchdaysForRound.find(
                                  (md) => md.alias === mdAlias,
                                )?.name || "Alle Spieltage"
                              : "Alle Spieltage"}
                          </span>
                          {mdAlias &&
                            (() => {
                              const currentMd = matchdaysForRound.find(
                                (md) => md.alias === mdAlias,
                              );
                              return (
                                currentMd?.startDate &&
                                currentMd?.endDate && (
                                  <span className="ml-2 truncate text-indigo-100">
                                    {formatDate(
                                      currentMd.startDate,
                                      currentMd.endDate,
                                    )}
                                  </span>
                                )
                              );
                            })()}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-white"
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
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs sm:text-sm">
                          <Listbox.Option
                            key="all-matchdays"
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-indigo-600 text-white"
                                  : "text-gray-900",
                                "relative cursor-default select-none py-2 pl-3 pr-9",
                              )
                            }
                            value={null}
                          >
                            {({ selected, active }) => (
                              <>
                                <div className="flex">
                                  <span
                                    className={classNames(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "truncate uppercase",
                                    )}
                                  >
                                    Alle Spieltage
                                  </span>
                                </div>
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
                          {matchdaysForRound.map((matchday) => (
                            <Listbox.Option
                              key={matchday.alias}
                              className={({ active }) =>
                                classNames(
                                  active
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-900",
                                  "relative cursor-default select-none py-2 pl-3 pr-9",
                                )
                              }
                              value={matchday}
                            >
                              {({ selected, active }) => (
                                <>
                                  <div className="flex">
                                    <span
                                      className={classNames(
                                        selected
                                          ? "font-semibold"
                                          : "font-normal",
                                        "truncate uppercase",
                                      )}
                                    >
                                      {matchday.alias === "ALL_GAMES"
                                        ? "Alle Spiele"
                                        : matchday.name}
                                    </span>
                                    {matchday.startDate && matchday.endDate && (
                                      <span
                                        className={classNames(
                                          active
                                            ? "text-indigo-200"
                                            : "text-gray-500",
                                          "ml-2 truncate",
                                        )}
                                      >
                                        {formatDate(
                                          matchday.startDate,
                                          matchday.endDate,
                                        )}
                                      </span>
                                    )}
                                  </div>
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
            )}
          </div>
        </div>
      </div>

      {/* Matches Display - Context-aware based on page mode */}
      {displayMatches.length > 0 ? (
        <>
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {matchdaysForRound.length > 1 && pageMode === "ROUND"
                ? "Spieltage"
                : "Spiele"}
            </h2>
            <MatchRefreshProvider inProgressMatchIds={inProgressMatchIds}>
              <MatchList
                matches={displayMatches}
                matchdays={pageMode === "ROUND" ? matchdaysForRound : []}
                mode={pageMode}
                from={`/tournaments/${tAlias}/${sAlias}${rAlias ? `/${rAlias}` : ""}${mdAlias ? `/${mdAlias}` : ""}`}
                onMatchUpdate={handleMatchUpdate}
                matchdayOwner={matchdayOwner}
              />
            </MatchRefreshProvider>
          </div>

          {/* Standings - Only for matchday mode with standings */}
          {pageMode === "MATCHDAY" &&
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
      ) : (
        <div className="text-center py-12">
          <p className={`text-sm text-gray-500 mb-0`}>
            {pageMode === "SEASON"
              ? "Keine Spiele für diese Saison"
              : pageMode === "MATCHDAY"
                ? "Keine Spiele für diesen Spieltag"
                : "Keine Spiele für diese Runde"}
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

    // Fetch matches for the season (only if no round selected)
    let selectedSeasonMatches: MatchValues[] = [];
    if (!rAlias) {
      try {
        const matchesResponse = await apiClient.get(
          `/matches?tournament=${tAlias}&season=${sAlias}`,
        );
        selectedSeasonMatches = matchesResponse.data || [];
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
    let matchdayOwner: { clubId: string; clubName: string; clubAlias: string } | null = null;

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
        matchdayOwner = matchdayResponse.data?.owner || null;
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
        selectedSeasonMatches,
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
        matchdayOwner: matchdayOwner || null,
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
