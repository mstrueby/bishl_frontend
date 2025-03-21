import Head from 'next/head';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Standings from '../../components/ui/Standings';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState, useRef } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, getDay } from 'date-fns';
import { de } from 'date-fns/locale'; // Import German locale
import ClipLoader from 'react-spinners/ClipLoader';
import { Match } from '../../types/MatchValues';
import MatchCard from '../../components/ui/MatchCard';
import Matchday from '../leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]';
import { MatchdayValues } from '../../types/TournamentValues';
import TeamFullNameSelect from '../../components/ui/TeamFullNameSelect';
import { Team } from '../../types/MatchValues';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { classNames } from '../../tools/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const CURRENT_SEASON = process.env.NEXT_PUBLIC_CURRENT_SEASON;

export const getStaticProps: GetStaticProps = async () => {
  try {
    const res = await fetch(`${BASE_URL}/matches?season=${CURRENT_SEASON}`);
    const matchesData: Match[] = await res.json();
    if (!matchesData || matchesData.length === 0) {
      return { notFound: true };
    }
    return {
      props: {
        matches: matchesData,
      },
      revalidate: 60
    };
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }
};

export default function Calendar({ matches }: { matches: Match[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const container = useRef<HTMLDivElement>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const previousMonth = () => {
    const firstDayNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(firstDayNextMonth);
  };

  const nextMonth = () => {
    const firstDayNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(firstDayNextMonth);
  };

  const matchesByDate = (date: Date) => {
    return matches.filter(match => {
      const matchDate = new Date(match.startDate);
      return isSameDay(matchDate, date);
    });
  };

  return (
    <Layout>
      <Head>
        <title>Kalender</title>
      </Head>

      <div className="flex h-full flex-col">
        <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h1 className="text-base font-semibold leading-6 text-gray-900">
              <time dateTime={format(currentMonth, 'yyyy-MM')}>
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </time>
            </h1>
          </div>
          <div className="flex items-center">
            <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
                onClick={previousMonth}
              >
                <span className="sr-only">Previous month</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
                onClick={() => setCurrentMonth(new Date())}
              >
                Heute
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
                onClick={nextMonth}
              >
                <span className="sr-only">Next month</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
        <div ref={container} className="flex flex-auto flex-col overflow-auto bg-white">
          <div className="flex w-full flex-auto">
            <div className="w-full flex-auto">
              <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700">
                <div className="bg-white py-2">Mo</div>
                <div className="bg-white py-2">Di</div>
                <div className="bg-white py-2">Mi</div>
                <div className="bg-white py-2">Do</div>
                <div className="bg-white py-2">Fr</div>
                <div className="bg-white py-2">Sa</div>
                <div className="bg-white py-2">So</div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {days.map((day, dayIdx) => {
                  const dayMatches = matchesByDate(day);
                  return (
                    <div
                      key={day.toString()}
                      className={classNames(
                        'relative bg-white',
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        'min-h-[8rem] py-2 px-3'
                      )}
                    >
                      <time
                        dateTime={format(day, 'yyyy-MM-dd')}
                        className={classNames(
                          'ml-auto flex h-6 w-6 items-center justify-center rounded-full',
                          isToday(day) && 'bg-indigo-600 font-semibold text-white',
                          !isToday(day) && isSameMonth(day, currentMonth) && 'text-gray-900',
                          !isToday(day) && !isSameMonth(day, currentMonth) && 'text-gray-400',
                          !isToday(day) && 'font-semibold'
                        )}
                      >
                        {format(day, 'd')}
                      </time>
                      <div className="space-y-1">
                        {dayMatches.map((match) => (
                          <div
                            key={match._id}
                            className="group flex cursor-pointer"
                          >
                            <p className="flex-auto truncate text-xs leading-5 text-gray-500">
                              {match.home.tinyName} vs {match.away.tinyName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="py-6 px-4">
          {matches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

const colStartClasses = [
  '',
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

function getDay(date: Date) {
  let day = date.getDay();
  return day === 0 ? 7 : day;
}