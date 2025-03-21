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
  const [isSelected, setIsSelected] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  // Generate an array of days for the current month
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
  useEffect(() => {
    // Set the container scroll position based on the current time.
    const currentMinute = new Date().getHours() * 60
    container.current.scrollTop =
      ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
        currentMinute) /
      1440
  }, [])


  return (
    <Layout>
      <Head>
        <title>Kalender</title>
      </Head>

      <div className="flex h-full flex-col">
        <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              <time dateTime="2022-01-22" className="sm:hidden">
                Jan 22, 2022
              </time>
              <time dateTime="2022-01-22" className="hidden sm:inline">
                January 22, 2022
              </time>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Saturday</p>
          </div>
          <div className="flex items-center">
            <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
              <button
                type="button"
                className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">Previous day</span>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
              >
                Today
              </button>
              <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
              <button
                type="button"
                className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">Next day</span>
                <ChevronRightIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="hidden md:ml-4 md:flex md:items-center">
              <Menu as="div" className="relative">
                <MenuButton
                  type="button"
                  className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Day view
                  <ChevronDownIcon className="-mr-1 size-5 text-gray-400" aria-hidden="true" />
                </MenuButton>

                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <div className="py-1">
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                      >
                        Day view
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                      >
                        Week view
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                      >
                        Month view
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                      >
                        Year view
                      </a>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
              <div className="ml-6 h-6 w-px bg-gray-300" />
              <button
                type="button"
                className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add event
              </button>
            </div>
            <Menu as="div" className="relative ml-6 md:hidden">
              <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500">
                <span className="sr-only">Open menu</span>
                <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
              >
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Create event
                    </a>
                  </MenuItem>
                </div>
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Go to today
                    </a>
                  </MenuItem>
                </div>
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Day view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Week view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Month view
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Year view
                    </a>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </header>
        <div className="isolate flex flex-auto overflow-hidden bg-white">
          <div ref={container} className="flex flex-auto flex-col overflow-auto">
            <div
              ref={containerNav}
              className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500 shadow ring-1 ring-black/5 md:hidden"
            >
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>W</span>
                {/* Default: "text-gray-900", Selected: "bg-gray-900 text-white", Today (Not Selected): "text-indigo-600", Today (Selected): "bg-indigo-600 text-white" */}
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                  19
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>T</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-indigo-600">
                  20
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>F</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                  21
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>S</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full bg-gray-900 text-base font-semibold text-white">
                  22
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>S</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                  23
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>M</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                  24
                </span>
              </button>
              <button type="button" className="flex flex-col items-center pb-1.5 pt-3">
                <span>T</span>
                <span className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold text-gray-900">
                  25
                </span>
              </button>
            </div>
            <div className="flex w-full flex-auto">
              <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
              <div className="grid flex-auto grid-cols-1 grid-rows-1">
                {/* Horizontal lines */}
                <div
                  className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                  style={{ gridTemplateRows: 'repeat(48, minmax(3.5rem, 1fr))' }}
                >
                  <div ref={containerOffset} className="row-end-1 h-7"></div>
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">12AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">1AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">2AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">3AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">4AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">5AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">6AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">7AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">8AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">9AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">10AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">11AM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">12PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">1PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">2PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">3PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">4PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">5PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">6PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">7PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">8PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">9PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">10PM</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">11PM</div>
                  </div>
                  <div />
                </div>

                {/* Events */}
                <ol
                  className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
                  style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
                >
                  <li className="relative mt-px flex" style={{ gridRow: '74 / span 12' }}>
                    <a
                      href="#"
                      className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-blue-50 p-2 text-xs/5 hover:bg-blue-100"
                    >
                      <p className="order-1 font-semibold text-blue-700">Breakfast</p>
                      <p className="text-blue-500 group-hover:text-blue-700">
                        <time dateTime="2022-01-22T06:00">6:00 AM</time>
                      </p>
                    </a>
                  </li>
                  <li className="relative mt-px flex" style={{ gridRow: '92 / span 30' }}>
                    <a
                      href="#"
                      className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-pink-50 p-2 text-xs/5 hover:bg-pink-100"
                    >
                      <p className="order-1 font-semibold text-pink-700">Flight to Paris</p>
                      <p className="order-1 text-pink-500 group-hover:text-pink-700">
                        John F. Kennedy International Airport
                      </p>
                      <p className="text-pink-500 group-hover:text-pink-700">
                        <time dateTime="2022-01-22T07:30">7:30 AM</time>
                      </p>
                    </a>
                  </li>
                  <li className="relative mt-px flex" style={{ gridRow: '134 / span 18' }}>
                    <a
                      href="#"
                      className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-indigo-50 p-2 text-xs/5 hover:bg-indigo-100"
                    >
                      <p className="order-1 font-semibold text-indigo-700">Sightseeing</p>
                      <p className="order-1 text-indigo-500 group-hover:text-indigo-700">Eiffel Tower</p>
                      <p className="text-indigo-500 group-hover:text-indigo-700">
                        <time dateTime="2022-01-22T11:00">11:00 AM</time>
                      </p>
                    </a>
                  </li>
                </ol>
              </div>
            </div>
          </div>
          <div className="hidden w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 md:block">
            <div className="flex items-center text-center text-gray-900">
              <button
                type="button"
                className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Previous month</span>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>
              <div className="flex-auto text-sm font-semibold">January 2022</div>
              <button
                type="button"
                className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Next month</span>
                <ChevronRightIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-7 text-center text-xs/6 text-gray-500">
              <div>Mo</div>
              <div>Di</div>
              <div>Mi</div>
              <div>Do</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>So</div>
            </div>
            <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
              {days.map((day, dayIdx) => (
                <button
                  key={day.toDateString()} // Changed key to avoid potential issues
                  type="button"
                  className={classNames(
                    'py-1.5 hover:bg-gray-100 focus:z-10',
                    isSameMonth(day, currentMonth) ? 'bg-white' : 'bg-gray-50',
                    (isSelected || isToday(day) ? 'font-semibold' : ''),
                    isSelected ? 'text-white' : '',
                    (!isSelected && isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-900' : '',
                    (!isSelected && !isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-400' : '',
                    (isToday(day) && !isSelected) ? 'text-indigo-600' : '',
                    dayIdx === 0 ? 'rounded-tl-lg' : '',
                    dayIdx === 6 ? 'rounded-tr-lg' : '',
                    dayIdx === days.length - 7 ? 'rounded-bl-lg' : '',
                    dayIdx === days.length - 1 ? 'rounded-br-lg' : '',
                    isSelected && !isToday(day) ? 'bg-gray-900' : ''
                  )}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={classNames(
                      'mx-auto flex size-7 items-center justify-center rounded-full',
                      isSelected && isToday(day) ? 'bg-indigo-600' : '',
                      isSelected && !isToday(day) ? 'bg-gray-900' : '',
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </Layout>
  )
};