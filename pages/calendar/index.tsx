import Head from 'next/head';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Standings from '../../components/ui/Standings';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon, FunnelIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState, useRef } from 'react'
import { Listbox, Transition, Dialog } from '@headlessui/react'
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
import { tournamentConfigs } from '../../tools/consts';
import type { VenueValues } from '../../types/VenueValues';
import type { ClubValues, TeamValues } from '../../types/ClubValues';


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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueValues | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubValues | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamValues | null>(null);


  // Generate an array of days for the current month
  const days = (() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysArray = eachDayOfInterval({ start, end });

    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = getDay(start);

    // Calculate how many days from previous month we need
    const daysFromPrevMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Add days from previous month
    const prevMonthDays = Array.from({ length: daysFromPrevMonth }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() - (daysFromPrevMonth - i));
      return date;
    });

    // Add days from next month to complete the grid
    const totalDays = prevMonthDays.length + daysArray.length;
    const daysNeeded = Math.ceil(totalDays / 7) * 7 - totalDays;

    const nextMonthDays = Array.from({ length: daysNeeded }, (_, i) => {
      const date = new Date(end);
      date.setDate(date.getDate() + i + 1);
      return date;
    });

    return [...prevMonthDays, ...daysArray, ...nextMonthDays];
  })();

  const previousMonth = () => {
    const firstDayNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(firstDayNextMonth);
  };

  const nextMonth = () => {
    const firstDayNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(firstDayNextMonth);
  };

  const matchesByDate = (date: Date) => {
    if (!date) return [];
    return matches.filter(match => {
      const matchDate = new Date(match.startDate);
      const dateMatches = matchDate.getDate() === date.getDate() &&
        matchDate.getMonth() === date.getMonth() &&
        matchDate.getFullYear() === date.getFullYear();

      const venueMatches = !selectedVenue || match.venue.venueId === selectedVenue._id;
      const clubMatches = !selectedClub || match.home.clubId === selectedClub._id || match.away.clubId === selectedClub._id;
      const teamMatches = !selectedTeam || match.home.teamId === selectedTeam._id || match.away.teamId === selectedTeam._id;

      return dateMatches && venueMatches && clubMatches && teamMatches;
    });
  };

  const matchesByDateTime = (date: Date, hour: number, minute: number) => {
    return matches.filter(match => {
      const matchDate = new Date(match.startDate);
      return isSameDay(matchDate, date) && matchDate.getHours() === hour && matchDate.getMinutes() === minute;
    })
  };

  useEffect(() => {
    // Always scroll to 9AM.
    const nineAMMinute = 9 * 60;
    if (container.current && containerNav.current && containerOffset.current) {
      container.current.scrollTop =
        ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
          nineAMMinute) /
        1440;
    }
  }, [selectedDate, selectedVenue, selectedClub, selectedTeam]); // Add selectedDay to dependency array


  return (
    <Layout>
      <Head>
        <title>Kalender</title>
      </Head>

      <div className="flex h-full flex-col">
        <header className="flex flex-none items-center justify-between border-b border-gray-200 px-2 sm:px-6 py-4">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              <time dateTime="2022-01-22" className="sm:hidden">
                {selectedDate ? format(selectedDate, 'EE, d. MMMM', { locale: de }) : null}
              </time>
              <time dateTime="2022-01-22" className="hidden sm:inline">
                {selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de }) : null}
              </time>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDate && matchesByDate(selectedDate).length > 0 ? matchesByDate(selectedDate).length === 1 ? '1 Spiel' : `${matchesByDate(selectedDate).length} Spiele` : 'Keine Spiele'}
            </p>
          </div>
          <div className="flex items-center">
            <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
              <button
                type="button"
                onClick={() => {
                  const prevDay = selectedDate ? new Date(selectedDate) : new Date();
                  prevDay.setDate(prevDay.getDate() - 1);
                  setSelectedDate(prevDay);
                }}
                className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">Vorheriger Tag</span>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentMonth(today);
                }}
                className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
              >
                Heute
              </button>
              <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
              <button
                type="button"
                onClick={() => {
                  const nextDay = selectedDate ? new Date(selectedDate) : new Date();
                  nextDay.setDate(nextDay.getDate() + 1);
                  setSelectedDate(nextDay);
                }}
                className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">Nächster Tag</span>
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
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <FunnelIcon className="h-5 w-5" aria-hidden="true" /> Filter
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
                    <button
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCurrentMonth(today);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
                    >
                      Heute
                    </button>
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
          <div ref={container} className="flex flex-auto flex-col overflow-auto h-[75vh]">
            {/* WEEK date picker (mobile) */}
            <div
              ref={containerNav}
              className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500 shadow ring-1 ring-black/5 md:hidden"
            >
              {[...Array(7)].map((_, index) => {
                const date = new Date(selectedDate || new Date());
                const currentDay = date.getDay();
                const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to start from Monday
                date.setDate(date.getDate() + diff + index);

                const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center pb-1.5 pt-3"
                  >
                    <span>{dayNames[index]}</span>
                    <div className="relative">
                      <span className={classNames(
                        "mt-3 flex size-8 items-center justify-center rounded-full text-base",
                        isSelected ? "bg-indigo-600 text-white font-semibold" :
                          isToday(date) ? "text-indigo-600 font-semibold" :
                            "text-gray-900"
                      )}>
                        {date.getDate()}
                      </span>
                      {matchesByDate(date).length > 0 && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-600"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* EVENTS view */}
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
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">0:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">1:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">2:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">3:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">4:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">5:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">6:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">7:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">8:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">9:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">10:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">11:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">12:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">13:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">14:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">15:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">16:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">17:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">18:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">19:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">20:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">21:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">22:00</div>
                  </div>
                  <div />
                  <div>
                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">23:00</div>
                  </div>
                  <div />
                </div>

                {/* Events */}
                <ol
                  className="relative col-start-1 col-end-2 row-start-1 grid grid-cols-1" // removed relative
                  style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
                >
                  {matchesByDate(selectedDate || new Date()).map((event, index, events) => {
                    // Find overlapping events
                    const eventStart = new Date(event.startDate);
                    const overlappingEvents = events.filter((otherEvent, otherIndex) => {
                      //if (otherIndex <= index) {
                      //  return false;
                      //}
                      const otherStart = new Date(otherEvent.startDate);
                      return Math.abs(eventStart.getTime() - otherStart.getTime()) <= 22 * 60000; // 5 minutes
                    });

                    // Calculate position for overlapping events
                    const columnCount = overlappingEvents.length;
                    const columnIndex = overlappingEvents.findIndex(e => e._id === event._id);
                    //console.log(event._id, overlappingEvents, columnCount, columnIndex)
                    const matchLength = tournamentConfigs[event.tournament.alias]?.matchLenMin || 30;
                    return (
                      <li
                        key={index}
                        className="absolute mt-px flex" // added border
                        style={{
                          gridRow: `${new Date(event.startDate).getHours() * 12 + Math.floor(new Date(event.startDate).getMinutes() / 5) + 2} / span ${Math.ceil(matchLength / 5)}`,
                          left: `${(100 / columnCount) * columnIndex}%`,
                          width: `${100 / columnCount}%`,
                          height: `calc(${matchLength / 16} * 1.75rem)`,
                          paddingRight: '1px'
                        }}
                      >
                        <a
                          href="#"
                          className={`group absolute inset-1 flex flex-col rounded-lg border-l-4 p-2 text-xs/5  overflow-hidden ${(() => {
                            switch (event.tournament.alias) {
                              case 'regionalliga-ost':
                                return 'bg-red-400/10 text-red-600 border-red-600/50 hover:bg-red-200/50';
                              case 'landesliga':
                                return 'bg-gray-400/10 text-gray-600 border-gray-600/50 hover:bg-gray-300/50';
                              case 'juniorenliga':
                              case 'juniorenliga-p':
                                return 'bg-green-400/10 text-green-600 border-green-600 hover:bg-green-200/50';
                              case 'jugendliga':
                              case 'jugendliga-lk2':
                              case 'jugendliga-p':
                                return 'bg-blue-400/10 text-blue-600 border-blue-600 hover:bg-blue-200/50';
                              case 'schuelerliga':
                              case 'schuelerliga-lk2':
                              case 'schuelerliga-p':
                                return 'bg-cyan-400/10 text-cyan-600 border-cyan-600/50 hover:bg-cyan-200/50';
                              case 'bambini':
                              case 'bambini-lk2':
                                return 'bg-purple-400/10 text-purple-600 border-purple-600 hover:bg-purple-200/50';
                              case 'mini':
                                return 'bg-pink-400/10 text-pink-600 border-pink-600 hover:bg-pink-200/50';
                              default:
                                return '';
                            }
                          })()}`}
                        >
                          <p className="block sm:hidden order-1 font-semibold truncate">
                            {columnCount >= 2
                              ? `${event.home.tinyName} - ${event.away.tinyName}`
                              : `${event.home.shortName} - ${event.away.shortName}`}
                          </p>
                          <p className="hidden sm:block order-1 font-semibold truncate">
                            {`${columnCount === 1
                              ? event.home.fullName
                              : columnCount <= 3
                              ? event.home.shortName
                              : event.home.tinyName
                            } - ${columnCount === 1
                              ? event.away.fullName
                              : columnCount <= 3
                              ? event.away.shortName
                              : event.away.tinyName
                            }`}
                          </p>
                          <p className="order-1 truncate">
                            {event.venue.name}
                          </p>
                          <p className="flex items-center gap-x-1.5 truncate">
                            <time dateTime={new Date(event.startDate).toISOString()}>
                              {format(new Date(event.startDate), 'HH:mm', { locale: de })}
                            </time>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                              <circle r={1} cx={1} cy={1} />
                            </svg>
                            {tournamentConfigs[event.tournament.alias]?.tinyName || event.tournament.name}
                          </p>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
          {/* MONTH date picker (tablet) */}
          <div className="hidden w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 md:block">
            <div className="flex items-center text-center text-gray-900">
              <button
                type="button"
                onClick={previousMonth}
                className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Previous month</span>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>
              <div className="flex-auto text-sm font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </div>
              <button
                type="button"
                onClick={nextMonth}
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
                  onClick={() => {
                    setSelectedDate(day);
                    setCurrentMonth(day);
                  }}
                  className={classNames(
                    'py-1.5 hover:bg-gray-100 focus:z-10',
                    isSameMonth(day, currentMonth) ? 'bg-white' : 'bg-gray-50',
                    (selectedDate && isSameDay(day, selectedDate) || isToday(day) ? 'font-semibold' : ''),
                    (selectedDate && isSameDay(day, selectedDate)) ? 'text-white' : '',
                    (!selectedDate && isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-900' : '',
                    (!selectedDate && !isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-400' : '',
                    (isToday(day) && (!selectedDate || !isSameDay(day, selectedDate))) ? 'text-indigo-600' : '',
                    dayIdx === 0 ? 'rounded-tl-lg' : '',
                    dayIdx === 6 ? 'rounded-tr-lg' : '',
                    dayIdx=== 0 ? 'rounded-bl-lg' : '',
                    dayIdx === days.length - 1 ? 'rounded-br-lg' : '',
                  )}
                >
                  <div className="relative w-full h-full flex flex-col items-center">
                    <time
                      dateTime={format(day, 'yyyy-MM-dd')}
                      className={classNames(
                        'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                        (selectedDate && isSameDay(day, selectedDate) || isToday(day)) ? 'font-semibold' : '',
                        (selectedDate && isSameDay(day, selectedDate)) ? 'bg-indigo-600 text-white' : '',
                        (!selectedDate && isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-900' : '',
                        (!selectedDate && !isSameMonth(day, currentMonth) && !isToday(day)) ? 'text-gray-400' : '',
                        (isToday(day) && (!selectedDate || !isSameDay(day, selectedDate))) ? 'text-indigo-600' : '',
                        dayIdx === 0 ? 'rounded-tl-lg' : '',
                        dayIdx === 6 ? 'rounded-tr-lg' : '',
                        dayIdx === days.length - 7 ? 'rounded-bl-lg' : '',
                        dayIdx === days.length - 1 ? 'rounded-br-lg' : '',
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                    </time>
                    {matchesByDate(day).length > 0 && (
                      <div className="absolute bottom-0 h-1 w-1 mt-0.5 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Filter Matches
                      </Dialog.Title>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Venue</label>
                        {/* Venue select */}
                        <select
                          value={selectedVenue?._id || ''}
                          onChange={e => setSelectedVenue(venues.find(v => v._id === e.target.value))}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">All Venues</option>
                          {venues.map(venue => (
                            <option key={venue._id} value={venue._id}>{venue.name}</option>
                          ))}
                        </select>

                        <label className="mt-3 block text-sm font-medium text-gray-700">Club</label>
                        {/* Club select */}
                        <select
                          value={selectedClub?._id || ''}
                          onChange={e => setSelectedClub(clubs.find(c => c._id === e.target.value))}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">All Clubs</option>
                          {clubs.map(club => (
                            <option key={club._id} value={club._id}>{club.name}</option>
                          ))}
                        </select>

                        <label className="mt-3 block text-sm font-medium text-gray-700">Team</label>
                        {/* Team select */}
                        <select
                          value={selectedTeam?._id || ''}
                          onChange={e => setSelectedTeam(teams.find(t => t._id === e.target.value))}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">All Teams</option>
                          {teams.map(team => (
                            <option key={team._id} value={team._id}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>

    </Layout>
  )
};