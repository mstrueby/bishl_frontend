import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { format } from 'date-fns'
import { TournamentFormValues } from '../../types/TournamentFormValues';

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
  matchStatus: {key:string; value:string};
  finishType: {key:string; value:string};
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

  useEffect(() => {
    setSelectedSeason(seasons.reduce((prev, current) => (prev.name > current.name) ? prev : current));
  }, [tournament]);

  useEffect(() => {
    async function fetchRounds() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${selectedSeason.alias}/rounds/`);
      const data = await response.json();
      setRounds(data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
      setSelectedRound(data[data.length - 1] || {} as Round);
    }
    if (selectedSeason.name) {
      fetchRounds();
    }
  }, [selectedSeason]);

  useEffect(() => {
    async function fetchMatchdays() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${selectedSeason.alias}/rounds/${selectedRound.alias}/matchdays/`);
      const data = await response.json();
      setMatchdays(data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
      setSelectedMatchday(data[data.length - 1] || {} as Matchday);
    }
    if (selectedRound.name) {
      fetchMatchdays();
    }
    setActiveTab('matches');
  }, [selectedRound]);

  useEffect(() => {
    
    async function fetchMatches() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/?tournament=${tournament.alias}&season=${selectedSeason.alias}&round=${selectedRound.alias}&matchday=${selectedMatchday.alias}`);
      const data = await response.json();
      setMatches(data);
    }

    if (selectedMatchday.name) {
      fetchMatches();
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
    return `${format(new Date(date_from), 'd. LLL')}${(new Date(date_to).getDate() !== new Date(date_from).getDate()) ? " - " + format(new Date(date_to), 'd. LLL') : ""}`
  }

  const router = useRouter()

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <Layout>

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
                        <span className="ml-2 truncate text-gray-500">{formatDate(selectedMatchday.startDate, selectedMatchday.endDate)}</span>
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
                                  <span className={classNames(active ? 'text-indigo-200' : 'text-gray-500', 'ml-2 truncate')}>
                                    {formatDate(matchday.startDate, matchday.endDate)}
                                  </span>
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


      {(activeTab == 'standings' || activeMatchdayTab == 'standings') && (
        <section className="mt-10">
          {/* <h2 className="text-2xl font-bold text-gray-900">Tabelle</h2> */}

            {selectedRound && selectedRound.standings && (
              <div>
                <table className="min-w-full mt-2">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Team</th>
                      <th className="px-4 py-2">GP</th>
                      <th className="px-4 py-2">W</th>
                      <th className="px-4 py-2">L</th>
                      <th className="px-4 py-2">D</th>
                      <th className="px-4 py-2">GF</th>
                      <th className="px-4 py-2">GA</th>
                      <th className="px-4 py-2">GD</th>
                      <th className="px-4 py-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(selectedRound.standings).map((teamKey) => {
                      const team = selectedRound.standings[teamKey];
                      return (
                        <tr key={teamKey}>
                          <td className="border px-4 py-2">{team.fullName}</td>
                          <td className="border px-4 py-2">{team.gamesPlayed}</td>
                          <td className="border px-4 py-2">{team.wins}</td>
                          <td className="border px-4 py-2">{team.losses}</td>
                          <td className="border px-4 py-2">{team.draws}</td>
                          <td className="border px-4 py-2">{team.goalsFor}</td>
                          <td className="border px-4 py-2">{team.goalsAgainst}</td>
                          <td className="border px-4 py-2">{team.goalsFor - team.goalsAgainst}</td>
                          <td className="border px-4 py-2">{team.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

        </section>
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