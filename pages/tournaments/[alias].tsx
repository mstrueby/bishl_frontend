import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'

interface Tournament {
  _id: string,
  name: string,
  alias: string,
  tiny_name: string,
  age_group: string,
  published: boolean,
  active: boolean,
  external: boolean,
  website: string,
  seasons: {
    year: number,
    published: boolean,
    rounds: {
      name: string,
      create_standings: boolean,
      create_stats: boolean,
      published: boolean,
      matchdays: {
        name: string,
        type: string,
        start_date: Date,
        end_date: Date,
        create_standings: boolean,
        create_stats: boolean,
        published: boolean,
        matches: {
          match_id: number,
          home_team: string,
          away_team: string,
          status: string,
          venue: string,
          home_score: number,
          away_score: number,
          overtime: boolean,
          shootout: boolean,
          start_time: Date,
          published: boolean,
        }[]
      }[]
    }[]
  }[];
};

export default function Tournament({
  tournament
}: {
  tournament: Tournament
}) {

  const years = tournament.seasons.map(season => season.year);
  const [selectedYear, setSelectedYear] = useState(years.sort((a, b) => b - a)[0])
  const rounds = tournament.seasons
    .filter((season) => season.year === selectedYear)
    .flatMap((season) => season.rounds)
    .map((round) => round.name);
  const [selectedRound, setSelectedRound] = useState(rounds[0])
  console.debug(rounds)

  const tabs = [
    { name: 'Spiele', href: '#', current: true },
    { name: 'Tabelle', href: '#', current: false },
  ]
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
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
          <Listbox value={selectedYear} onChange={setSelectedYear}>
            {({ open }) => (
              <>
                <div className="relative mt-2">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    <span className="block truncate">{selectedYear}</span>
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
                      {tournament.seasons.map((season) => (
                        <Listbox.Option
                          key={season.year}
                          className={({ active }) =>
                            classNames(
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                              'relative cursor-default select-none py-2 pl-3 pr-9'
                            )
                          }
                          value={season.year}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                {season.year}
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

          <Listbox value={selectedRound} onChange={setSelectedRound}>
            {({ open }) => (
              <>
                <Listbox.Label className="sr-only">Change round</Listbox.Label>
                <div className="relative mt-2 ml-3 ">
                  <div className="inline-flex divide-x divide-indigo-700 rounded-md shadow-sm ">
                    <div className="inline-flex items-center gap-x-1.5 rounded-l-md bg-indigo-600 px-3 py-2 text-white shadow-sm">
                      <CheckIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                      <p className="text-sm font-semibold">{selectedRound}</p>
                    </div>
                    <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md bg-indigo-600 p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-gray-50">
                      <span className="sr-only">Change published status</span>
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
                      {rounds.map((round, index) => (
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
                                <p className={selected ? 'font-semibold' : 'font-normal'}>{round}</p>
                                {selected ? (
                                  <span className={active ? 'text-white' : 'text-indigo-600'}>
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </div>
                              <p className={classNames(active ? 'text-indigo-200' : 'text-gray-500', 'mt-2')}>
                                1. Apr. - 31. Aug.
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
        </div>
      </div>




      <div className="relative border-b border-gray-200 pb-5 sm:pb-0">
        <div className="mt-4">
          <div className="sm:hidden">
            <label htmlFor="current-tab" className="sr-only">
              Select a tab
            </label>
            <select
              id="current-tab"
              name="current-tab"
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              defaultValue={tabs.find((tab) => tab.current).name}
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <a
                  key={tab.name}
                  href={tab.href}
                  className={classNames(
                    tab.current
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium'
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <section>


        {tournament.seasons[0].rounds[0].matchdays[0].matches?.map(({ match_id, home_team, away_team, home_score, away_score, venue, start_time }) => (
          <div key={match_id} className="flex justify-between gap-x-6 p-4 my-10 border rounded-xl">
            <div className="flex gap-x-4">
              <div className="min-w-0 flex-auto">
                <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src="" alt="" />
                <p className="text-sm font-semibold leading-6 text-gray-900">{home_team}</p>
                <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src="" alt="" />
                <p className="text-sm font-semibold leading-6 text-gray-900">{away_team}</p>
                <p className="mt-1 truncate text-xs leading-5 text-gray-500">{venue}, <time dateTime={start_time}>{start_time}</time></p>
              </div>
            </div>
            <div className="sm:flex sm:flex-col sm:items-end">
              <p className="text-sm font-semibold leading-6 text-gray-900">{home_score}</p>
              <p className="text-sm font-semibold leading-6 text-gray-900">{away_score}</p>

              {/*             {person.lastSeen ? (
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Last seen <time dateTime={person.lastSeenDateTime}>{person.lastSeen}</time>
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-x-1.5">
                <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs leading-5 text-gray-500">Online</p>
              </div>
            )} */}
            </div>
          </div>
        ))}

      </section>
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${params.alias}`);
  var tournament = await res.json();
  return {
    props: {
      tournament,
    },
    revalidate: 10,
  };
};