import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import { BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface Tournament  {
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
  const [selected, setSelected] = useState(tournament.name)

  const tabs = [
  { name: 'Spiele', href: '#', current: true },
  { name: 'Tabelle', href: '#', current: false },
]
  function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
  return (
    <Layout>
      <Head>
        <title>{tournament.name}</title>
      </Head>

      <div className="relative border-b border-gray-200 pb-5 sm:pb-0">
        <div className="md:flex md:items-center md:justify-between">
          <h1 className="text-base font-semibold leading-6 text-gray-900">{tournament.name}</h1>
          <div className="mt-3 sm:ml-4 sm:mt-0">
            <label htmlFor="mobile-search-candidate" className="sr-only">
              Search
            </label>
            <label htmlFor="desktop-search-candidate" className="sr-only">
              Search
            </label>
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex-grow focus-within:z-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  {/* Listbox einfügen */}       
                </div>
                <ul>
                  {tournament && tournament.seasons?.map(({ year }, index) => (
                    <li key={index}>
                      {year}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
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


<ul role="list" className="divide-y divide-gray-100">
      {tournament.seasons[0].rounds[0].matchdays[0].matches?.map(( { match_id, home_team, away_team, home_score, away_score, venue, start_time } ) => (
        <li key={match_id} className="flex justify-between gap-x-6 py-5">
          <div className="flex gap-x-4">
            <div className="min-w-0 flex-auto">
              <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src="" alt="" />
              <p className="text-sm font-semibold leading-6 text-gray-900">{home_team}</p>
              <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src="" alt="" />
              <p className="text-sm font-semibold leading-6 text-gray-900">{away_team}</p>
              <p className="mt-1 truncate text-xs leading-5 text-gray-500">{venue}, <time dateTime={start_time}>{start_time}</time></p>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-col sm:items-end">
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
        </li>
      ))}
    </ul>
        
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
  return { paths, fallback: false };
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