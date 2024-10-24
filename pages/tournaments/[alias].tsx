import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import Standings from '../../components/ui/Standings';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'; // Import German locale
import { TournamentFormValues } from '../../types/TournamentFormValues';
import ClipLoader from 'react-spinners/ClipLoader';

interface TeamStats {
  goalsFor: number;
  goalsAgainst: number;
}

interface Team {
  clubAlias: string;
  teamAlias: string;
  name: string;
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  stats: TeamStats;

}

interface Match {
  matchId: number;
  home: Team;
  away: Team;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  venue: {
    name: string;
    alias: string;
  };
  startDate: Date;
  published: boolean;
}

interface StandingsTeam {
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  otWins: number;
  otLosses: number;
  soWins: number;
  soLosses: number;
  streak: string[];
}

interface Matchday {
  name: string;
  alias: string;
  type: { key: string; value: string };
  startDate: Date;
  endDate: Date;
  createStandings: boolean;
  createStats: boolean;
  published: boolean;
  standings: Record<string, StandingsTeam>;
  matchSettings: Record<string, any>;
  matches: Match[];
}

interface Round {
  name: string;
  alias: string;
  createStandings: boolean;
  createStats: boolean;
  matchdaysType: {
    key: string;
    value: string;
  };
  matchdaysSortedBy: {
    key: string;
    value: string;
  };
  startDate: Date;
  endDate: Date;
  published: boolean;
  matchSettings: Record<string, any>;
  matchdays: Matchday[];
  standings: Record<string, StandingsTeam>;
}

interface Season {
  name: string;
  alias: string;
  published: boolean;
  rounds: Round[];
}

interface Tournament {
  _id: string;
  name: string;
  alias: string;
  tinyName: string;
  ageGroup: string;
  published: boolean;
  active: boolean;
  external: boolean;
  website: string;
  seasons: Season[];
}

export default function Tournament({
  tournament
}: {
  tournament: Tournament
}) {

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);
  const [isLoadingMatchdays, setIsLoadingMatchdays] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoadingInitial(true);
    setIsLoadingRounds(true);
    setIsLoadingMatchdays(true);
    setIsLoadingMatches(true);
    if (!router.isFallback && tournament) {
      // Set the initial selected season
      const sortedSeasons = tournament.seasons.sort((a, b) => b.name.localeCompare(a.name));
      setSelectedSeason(sortedSeasons[0]);
    }
    setIsLoadingInitial(false);
  }, [router.isFallback, tournament]);

  let seasons: Season[] = tournament ? tournament.seasons.sort((a, b) => b.name.localeCompare(a.name)) : [];
  const [selectedSeason, setSelectedSeason] = useState(seasons ? seasons[0] : {} as Season);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState({} as Round);

  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState({} as Matchday);

  const [matches, setMatches] = useState<Match[]>([]);


  /*
  let matchdays: Matchday[] = selectedRound ? selectedRound.matchdays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) : [];
  const [selectedMatchday, setSelectedMatchday] = useState(matchdays ? matchdays[matchdays.length - 1] : {} as Matchday)
*/
  const [activeTab, setActiveTab] = useState('matches');
  const [activeMatchdayTab, setActiveMatchdayTab] = useState('matches');

  {/*
  useEffect(() => {
    setSelectedSeason(seasons.reduce((prev, current) => (prev.name > current.name) ? prev : current));
  }, [tournament]);
  */}

  useEffect(() => {
    if (selectedSeason.name) {
      setIsLoadingRounds(true);
      setIsLoadingMatchdays(true);
      setIsLoadingMatches(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${selectedSeason.alias}/rounds/`)
        .then((response) => response.json())
        .then((data) => {
          setRounds(data.sort((a, b) => a.sortOrder - b.sortOrder));
          setSelectedRound(data[data.length - 1] || {} as Round);
        })
        .finally(() => {
          setIsLoadingRounds(false);
          setActiveTab('matches');
        });
    }
  }, [selectedSeason]);

  useEffect(() => {
    if (selectedRound.name) {
      setIsLoadingMatchdays(true);
      setIsLoadingMatches(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${selectedSeason.alias}/rounds/${selectedRound.alias}/matchdays/`)
        .then((response) => response.json())
        .then((data) => {
          setMatchdays(data.sort((a, b) => {
            if (selectedRound.matchdaysSortedBy.key === 'STARTDATE') {
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            } else if (selectedRound.matchdaysSortedBy.key === 'NAME') {
              return a.name.localeCompare(b.name);
            }
            return 0;
          }));
          if (selectedRound.matchdaysType.key === 'GROUP') {
            setSelectedMatchday(data[0] || {} as Matchday);
          } else {
            const now = new Date().getTime();
            const mostRecentPastMatchday = data.filter(matchday => new Date(matchday.startDate).getTime() <= now)
                                            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
            setSelectedMatchday(mostRecentPastMatchday || {} as Matchday);
          }
        })
        .finally(() => {
          setIsLoadingMatchdays(false);
          setActiveTab('matches');
          setActiveMatchdayTab('matches');
        });
    }
  }, [selectedRound]);

  useEffect(() => {
    if (selectedMatchday.name) {
      setIsLoadingMatches(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/?tournament=${tournament.alias}&season=${selectedSeason.alias}&round=${selectedRound.alias}&matchday=${selectedMatchday.alias}`)
        .then((response) => response.json())
        .then((data) => setMatches(data))
        .finally(() => setIsLoadingMatches(false));
    }
  }, [selectedMatchday]);

  const tabs = [
    { key: 'matches', caption: 'Spiele', href: '' },
    { key: 'standings', caption: 'Tabelle', href: '' },
  ]
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  function formatDate(date_from: Date, date_to: Date) {
    return `${format(new Date(date_from), 'd. LLL', { locale: de })}` +
           `${(new Date(date_to).getDate() !== new Date(date_from).getDate()) ? " - " + format(new Date(date_to), 'd. LLL', { locale: de }) : ""}`;
  }

  // Show loading spinner if any loading state is true
  if (router.isFallback || isLoadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-container">
          <ClipLoader color={"#4f46e5"} loading={true} size={150} />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {router.isFallback || isLoadingInitial || isLoadingRounds || isLoadingMatchdays || isLoadingMatches ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="spinner-container">
            <ClipLoader color={"#4f46e5"} loading={true} size={150} />
          </div>
        </div>
      ) : (
        <Fragment>
          <Head>
            <title>{tournament.name}</title>
          </Head>

          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {tournament.name}
              </h2>
            </div>

            <div className="mt-4 flex sm:ml-4 sm:mt-0 justify-end">

              {/* Drop-Down SEASON */}
              <Listbox value={selectedSeason} onChange={setSelectedSeason}>
                {({ open }) => (
                  <>
                    <Listbox.Label className="sr-only">Change Season</Listbox.Label>
                    <div className="relative mt-2">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        <span className="block truncate">{selectedSeason.name}</span>
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
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-28 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {seasons.map((season, index) => (
                            <Listbox.Option
                              key={index}
                              className={({ active }) =>
                                classNames(
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-3 pr-9'
                                )
                              }
                              value={season}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                    {season.name}
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

              {/* Drop-Down ROUND */}
              {rounds.length > 1 &&
                <Listbox value={selectedRound} onChange={setSelectedRound}>
                  {({ open }) => (
                    <>
                      <Listbox.Label className="sr-only">Change Round</Listbox.Label>
                      <div className="relative mt-2 ml-3 ">
                        <div className="inline-flex divide-x divide-indigo-700 rounded-md shadow-sm ">
                          <div className="inline-flex items-center gap-x-1.5 rounded-l-md bg-indigo-600 px-3 py-2 text-white shadow-sm">
                            {//<CheckIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                            }
                            <p className="text-sm font-semibold">{selectedRound.name}</p>
                          </div>
                          <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md bg-indigo-600 p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-gray-50">
                            <ChevronDownIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </Listbox.Button>
                        </div>

                        <Transition
                          show={open}
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute right-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {rounds?.map((round, index) => (
                              <Listbox.Option
                                key={index}
                                className={({ active }) =>
                                  classNames(
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                    'cursor-default select-none p-4 text-sm'
                                  )
                                }
                                value={round}
                              >
                                {({ selected, active }) => (
                                  <div className="flex flex-col">
                                    <div className="flex justify-between">
                                      <p className={selected ? 'font-semibold' : 'font-normal'}>{round.name}</p>
                                      {selected ? (
                                        <span className={active ? 'text-white' : 'text-indigo-600'}>
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className={classNames(active ? 'text-indigo-200' : 'text-gray-500', 'mt-2')}>
                                      {formatDate(round.startDate, round.endDate)}
                                    </p>
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
              }
            </div>
          </div>


          {/* ROUND sub menu */}
          <div className="relative mt-10 mb-6 ">
            {selectedRound && selectedRound.createStandings && (
              <div className="border-b border-gray-200">
                <div className="sm:block ">
                  <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab, index) => (
                      <a
                        key={index}
                        href={tab.href}
                        className={classNames(
                          tab.key == activeTab
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium'
                          , tab.key === 'standings' && selectedRound.createStandings === false ? 'hidden' : ''
                        )}
                        aria-current={tab.key == activeTab ? 'page' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveTab(tab.key)
                        }}
                      >
                        {tab.caption}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </div>

          {activeTab == 'matches' && (
            <section className="mt-10">
              {/* <h2 className="text-2xl font-bold text-gray-900">Spiele</h2> */}

              {/* MATCHDAY dropdown */}
              {/*
              <div className="mt-4">
                <span>{`${selectedRound.matchdaysType.key} / ${selectedRound.matchdaysSortedBy.key}`}</span>   
              </div>  
              */}
              {matchdays.length > 1 &&
                <Listbox value={selectedMatchday} onChange={setSelectedMatchday}>
                  {({ open }) => (
                    <>
                      {/* <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">{selectedRound.matchdaysType.value}:</Listbox.Label> */}
                      <Listbox.Label className="sr-only">Change Matchday</Listbox.Label>
                      <div className="relative mt-2">
                        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                          <span className="inline-flex w-full truncate">
                            <span className="truncate">{selectedMatchday.name}</span>
                            {selectedRound.matchdaysType.key !== 'GROUP' && (
                                <span className="ml-2 truncate text-gray-500">{formatDate(selectedMatchday.startDate, selectedMatchday.endDate)}</span>
                            )}
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
                            {matchdays.map((matchday, index) => (
                              <Listbox.Option
                                key={index}
                                className={({ active }) =>
                                  classNames(
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                    'relative cursor-default select-none py-2 pl-3 pr-9'
                                  )
                                }
                                value={matchday}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <div className="flex">
                                      <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'truncate')}>
                                        {matchday.name}
                                      </span>
                                      {selectedRound.matchdaysType.key !== 'GROUP' && (
                                        <span className={classNames(active ? 'text-indigo-200' : 'text-gray-500', 'ml-2 truncate')}>
                                          {formatDate(matchday.startDate, matchday.endDate)}
                                        </span>
                                      )}
                                    </div>

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
              }

              {/* MATCHDAY sub menu */}
              {selectedMatchday && selectedMatchday.createStandings && (
                <div className="my-6">
                  <div className="sm:block">
                    <nav className="flex space-x-4" aria-label="Tabs">
                      {tabs.map((tab, index) => (
                        <a
                          key={index}
                          href={tab.href}
                          className={classNames(
                            tab.key == activeMatchdayTab ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:text-gray-700',
                            'rounded-md px-3 py-2 text-sm font-medium'
                          )}
                          aria-current={tab.key == activeMatchdayTab ? 'page' : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            setActiveMatchdayTab(tab.key)
                          }}
                        >
                          {tab.caption}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {/* MATCHES */}
              {activeMatchdayTab == 'matches' && matches?.map((match, index) => (
                <div key={index} className="flex justify-between gap-x-6 p-4 my-10 border rounded-xl">
                  <div className="flex gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <Image className="h-12 w-12 flex-none" src={match.home.logo ? match.home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.home.tinyName} objectFit="contain" height={50} width={50} />
                      <p className="text-sm font-semibold leading-6 text-gray-900">{match.home.fullName}</p>
                      <Image className="h-12 w-12 flex-none" src={match.away.logo ? match.away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.away.tinyName} objectFit="contain" height={50} width={50} /><p className="text-sm font-semibold leading-6 text-gray-900">{match.away.fullName}</p>
                      <p className="mt-1 truncate text-xs leading-5 text-gray-500">{match.venue.name},&nbsp;
                        <time dateTime={format(new Date(match.startDate), 'yyyy-MM-dd')}>
                          {format(new Date(match.startDate), 'd. MMM yy')}
                        </time>
                      </p>
                    </div>
                  </div>
                  <div className="sm:flex sm:flex-col sm:items-end">
                    <p className="text-sm font-semibold leading-6 text-gray-900">{match.home.stats.goalsFor}</p>
                    <p className="text-sm font-semibold leading-6 text-gray-900">{match.away.stats.goalsFor}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {(activeTab == 'standings' && selectedRound && selectedRound.standings) && (
            <Standings standingsData={selectedRound.standings}
              matchSettings={selectedRound.matchSettings}
            />
          )}

          {(activeMatchdayTab == 'standings' && selectedMatchday && selectedMatchday.standings) && (
            <Standings standingsData={selectedMatchday.standings}
              matchSettings={selectedMatchday.matchSettings}
            />
          )}
        </Fragment>
      )}
    </Layout>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
  const allTournamentsData = await res.json();
  const paths = allTournamentsData.map((tournament: Tournament) => ({
    params: { alias: tournament.alias },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const alias = params?.alias;

  if (!alias) {
    // Handle the case where alias is undefined, possibly by returning a default response or throwing an error
    throw new Error("Alias parameter is missing.");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${alias}`);
  var tournament = await res.json();
  return {
    props: {
      tournament,
    },
    revalidate: 10,
  };
};