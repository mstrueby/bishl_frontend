import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { PostValues } from '../types/PostValues';
import { Match } from '../types/MatchValues';
import { TournamentValues } from '../types/TournamentValues';
import Layout from "../components/Layout";
import { getFuzzyDate } from '../tools/dateUtils';
import { ArrowLongRightIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CalendarIcon, MapPinIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';
import SuccessMessage from '../components/ui/SuccessMessage';
import TournamentSelect from '../components/ui/TournamentSelect';
import MatchStatusBadge from '../components/ui/MatchStatusBadge';
import { classNames } from '../tools/utils';
import { tournamentConfigs } from '../tools/consts';
import Image from 'next/image';


let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/posts/';

interface PostsProps {
  jwt: string | null,
  posts: PostValues[],
  todaysMatches: Match[],
  upcomingMatches: Match[],
  restOfWeekMatches: { date: string, dayName: string, matches: Match[] }[],
  tournaments: TournamentValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) || null;
  let posts = null;
  let todaysMatches = null;
  let tournaments = null;
  const today = new Date().toISOString().split('T')[0];

  try {
    const res = await axios.get(BASE_URL, {
      params: {
        published: true,
        limit: 3
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    posts = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching posts:", error);
    }
  }

  // Fetch today's matches
  try {
    const matchesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/matches/today`, {

    });
    todaysMatches = matchesRes.data;
  } catch (error) {
    console.error("Error fetching today's matches:", error);
  }

  // Fetch upcoming matches
  let upcomingMatches = null;
  try {
    const upcomingRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/matches/upcoming`, {

    });
    upcomingMatches = upcomingRes.data;
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
  }

  // Fetch matches for rest of the week
  let restOfWeekMatches = null;
  try {
    const restOfWeekRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/matches/rest-of-week`, {

    });
    restOfWeekMatches = restOfWeekRes.data;
  } catch (error) {
    console.error("Error fetching rest of week matches:", error);
  }

  // Fetch tournaments
  try {
    const tournamentsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
    tournaments = tournamentsRes.data;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
  }

  return {
    props: {
      jwt,
      posts: posts || [],
      todaysMatches: todaysMatches || [],
      upcomingMatches: upcomingMatches || [],
      restOfWeekMatches: restOfWeekMatches || [],
      tournaments: tournaments || []
    }
  };
}


const Home: NextPage<PostsProps> = ({ jwt, posts = [], todaysMatches = [], upcomingMatches = [], restOfWeekMatches = [], tournaments = [] }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<TournamentValues | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>(todaysMatches);
  const router = useRouter();

  // Use upcoming matches if no today's matches
  const displayMatches = todaysMatches.length > 0 ? todaysMatches : upcomingMatches;
  const isShowingUpcoming = todaysMatches.length === 0 && upcomingMatches.length > 0;

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  // Filter matches by selected tournament
  useEffect(() => {
    if (selectedTournament) {
      setFilteredMatches(displayMatches.filter(match => match.tournament.alias === selectedTournament.alias));
    } else {
      setFilteredMatches(displayMatches);
    }
  }, [selectedTournament, displayMatches]);

  // Helper function to get time slot for a match
  const getTimeSlot = (date: Date) => {
    const hour = new Date(date).getHours();

    if (hour < 10) {
      return { key: 'morning', label: 'Morgens', description: 'Vor 10 Uhr' };
    } else if (hour < 12) {
      return { key: 'beforenoon', label: 'Vormittags', description: '10-12 Uhr' };
    } else if (hour < 14) {
      return { key: 'noon', label: 'Mittags', description: '12-14 Uhr' };
    } else if (hour < 16) {
      return { key: 'afternoon', label: 'Nachmittags', description: '14-16 Uhr' };
    } else if (hour < 18) {
      return { key: 'lateafternoon', label: 'Später Nachmittag', description: '16-18 Uhr' };
    } else if (hour < 20) {
      return { key: 'evening', label: 'Abends', description: '18-20 Uhr' };
    } else {
      return { key: 'night', label: 'Heute Nacht', description: 'Ab 20 Uhr' };
    }
  };

  // Group matches by time slots
  const groupMatchesByTimeSlot = (matches: Match[]) => {
    const groups: { [key: string]: { label: string; description: string; matches: Match[] } } = {};

    matches.forEach(match => {
      const timeSlot = getTimeSlot(match.startDate);
      if (!groups[timeSlot.key]) {
        groups[timeSlot.key] = {
          label: timeSlot.label,
          description: timeSlot.description,
          matches: []
        };
      }
      groups[timeSlot.key].matches.push(match);
    });

    // Sort groups by time order
    const sortedGroups = Object.entries(groups).sort(([keyA], [keyB]) => {
      const order = ['morning', 'beforenoon', 'noon', 'afternoon', 'lateafternoon', 'evening', 'night'];
      return order.indexOf(keyA) - order.indexOf(keyB);
    });

    return sortedGroups.map(([key, group]) => group);
  };

  // Categorize matches
  const categorizeMatches = (matches: Match[]) => {
    const live = matches.filter(match => match.matchStatus.key === 'INPROGRESS');
    const upcoming = matches.filter(match => match.matchStatus.key === 'SCHEDULED');
    const finished = matches.filter(match => ['FINISHED', 'FORFEITED'].includes(match.matchStatus.key));

    return { live, upcoming, finished };
  };

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Shared formatTime function
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // TournamentCard component for grouped upcoming matches
  const TournamentCard = ({ tournament, matches }: { tournament: TournamentValues, matches: Match[] }) => {
    const tournamentConfig = tournamentConfigs[tournament.alias];
    const sortedMatches = matches.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="mb-4">
          {tournamentConfig && (
            <span className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", tournamentConfig.bdgColLight)}>
              {tournamentConfig.tinyName}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {sortedMatches.map((match) => (
            <div key={match._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {match.home.shortName} - {match.away.shortName}
                </div>
                <div className="text-xs text-gray-500">
                  {match.venue.name}
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">
                {formatTime(match.startDate)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // MatchCard component for today's games
  const MatchCard = ({ match }: { match: Match }) => {

    // Determine border color based on match status and date
    const getBorderColor = () => {
      // Check if match is today
      const today = new Date().toDateString();
      const matchDate = new Date(match.startDate).toDateString();
      const isToday = today === matchDate;

      switch (match.matchStatus.key) {
        case 'INPROGRESS':
          return 'border-l-red-500';
        case 'SCHEDULED':
          return isToday ? 'border-l-green-500' : ''; // Only show color for today's scheduled matches
        case 'FINISHED':
        case 'FORFEITED':
          return 'border-l-gray-500';
        default:
          return 'border-l-gray-300';
      }
    };

    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 ${getBorderColor() ? `border-l-4 ${getBorderColor()}` : ''} p-4 hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 font-medium uppercase">
            {(() => {
              const item = tournamentConfigs[match.tournament.alias];
              if (item) {
                return (
                  <span
                    key={item.tinyName}
                    className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset w-full", item.bdgColLight)}
                  >
                    {item.tinyName} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                  </span>
                );
              }
            })()}
          </div>
          {match.matchStatus.key === 'SCHEDULED' ? (
            <div className="text-sm text-gray-600 font-medium">
              {formatTime(match.startDate)}
            </div>
          ) : (
            <MatchStatusBadge
              statusKey={match.matchStatus.key}
              finishTypeKey={match.finishType.key}
              statusValue={match.matchStatus.value}
              finishTypeValue={match.finishType.value}
            />
          )}
        </div>

        <div className="flex flex-col gap-y-1.5 justify-betwee mt-6 mb-4">
          {/* home */}
          <div className="flex flex-row items-center w-full">
            <div className="flex-none">
              <Image className="flex-none" src={match.home.logo ? match.home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.home.tinyName} objectFit="contain" height={32} width={32} />
            </div>
            <div className="flex-auto ml-6 truncate text-ellipsis">
              <p className={`block text-base font-medium ${match.home.stats.goalsFor > match.away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{match.home.shortName}</p>
            </div>
            {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
              <div className="flex-none w-10">
                <p className={`text-lg sm:max-md:text-base font-medium ${match.home.stats.goalsFor > match.away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{match.home.stats.goalsFor}</p>
              </div>
            )}
          </div>
          {/* away */}
          <div className="flex flex-row items-center w-full">
            <div className="flex-none">
              <Image className="flex-none" src={match.away.logo ? match.away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.away.tinyName} objectFit="contain" height={32} width={32} />
            </div>
            <div className="flex-auto ml-6 w-full truncate">
              <p className={`block text-base font-medium ${match.away.stats.goalsFor > match.home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{match.away.shortName}</p>
            </div>
            {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
              <div className="flex-none w-10">
                <p className={`text-lg sm:max-md:text-base font-medium ${match.away.stats.goalsFor > match.home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{match.away.stats.goalsFor}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center truncate mr-4">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
            <p className="text-xs uppercase font-light text-gray-700 truncate">{match.venue.name}</p>
          </div>
          {(match.matchStatus.key === 'INPROGRESS' || match.matchStatus.key === 'FINISHED') && (
            <Link href={`/matches/${match._id}`}>
              <a className="text-indigo-600 hover:text-indigo-800 font-medium">
                Spielbericht
              </a>
            </Link>
          )}
        </div>
      </div>
    );
  };

  const postItems = posts
    .slice()
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
    .map((post: PostValues) => ({
      _id: post._id,
      title: post.title,
      alias: post.alias,
      author_firstname: post.author.firstName,
      author_lastname: post.author.lastName,
      content: post.content,
      imageUrl: post.imageUrl,
      createUser: post.createUser.firstName + ' ' + post.createUser.lastName,
      createDate: new Date(post.createDate).toISOString(),
      updateUser: post.updateUser ? (post.updateUser.firstName + ' ' + post.updateUser.lastName) : '-',
      updateDate: new Date(post.updateDate).toISOString(),
      published: post.published,
      featured: post.featured,
    }));

  return (
    <>
      <Head>
        <title>BISHL</title>
      </Head>
      <Layout>
        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

        {/* Today's Games or Upcoming Games Section */}
        {(todaysMatches.length > 0 || upcomingMatches.length > 0) && (

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mt-12 mb-8">
              <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {isShowingUpcoming ? 'Nächste Spiele' : 'Aktuelle Spiele'}
              </h2>
              {isShowingUpcoming && upcomingMatches.length > 0 && (
                <p className="mt-2 mb-12 text-lg/8 text-gray-600">
                  {new Date(upcomingMatches[0].startDate).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Tournament Filter - Only show for today's matches */}
            {!isShowingUpcoming && (
              <div className="sm:max-w-xs mx-auto mb-12">
                <TournamentSelect
                  selectedTournament={selectedTournament}
                  onTournamentChange={setSelectedTournament}
                  allTournamentsData={tournaments}
                />
              </div>
            )}

            {(() => {
              // If showing upcoming matches and more than 3, group by tournament
              if (isShowingUpcoming && filteredMatches.length > 3) {
                const matchesByTournament = filteredMatches.reduce((acc, match) => {
                  const tournamentAlias = match.tournament.alias;
                  if (!acc[tournamentAlias]) {
                    // Find the full tournament data from the tournaments array
                    const fullTournament = tournaments.find(t => t.alias === tournamentAlias);
                    acc[tournamentAlias] = {
                      tournament: fullTournament || {
                        _id: '',
                        name: match.tournament.name,
                        alias: match.tournament.alias,
                        tinyName: match.tournament.alias,
                        ageGroup: { key: '', value: '' },
                        published: true,
                        active: true,
                        external: false,
                        seasons: []
                      },
                      matches: []
                    };
                  }
                  acc[tournamentAlias].matches.push(match);
                  return acc;
                }, {} as Record<string, { tournament: TournamentValues, matches: Match[] }>);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(matchesByTournament).map(({ tournament, matches }) => (
                      <TournamentCard key={tournament.alias} tournament={tournament} matches={matches} />
                    ))}
                  </div>
                );
              }

              // For today's matches or ≤3 upcoming matches, use existing logic
              const { live, upcoming, finished } = categorizeMatches(filteredMatches);

              return (
                <div className="space-y-20">
                  {/* Live Games */}
                  {live.length > 0 && (
                    <div>
                      <div className="min-w-0 flex-1">
                        <div className="border-b border-gray-200 pb-5 dark:border-white/10 mb-6">
                          <div className="-mt-2 -ml-2 flex flex-wrap items-baseline">
                            <h2 className="mt-2 ml-2 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">Live</h2>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {live.map((match) => (
                          <MatchCard key={match._id} match={match} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Games */}
                  {upcoming.length > 0 && (
                    <div>
                      {!isShowingUpcoming && (
                        <div className="min-w-0 flex-1">
                          <div className="border-b border-gray-200 pb-5 dark:border-white/10 mb-6">
                            <div className="-mt-2 -ml-2 flex flex-wrap items-baseline">
                              <h2 className="mt-2 ml-2 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">Demnächst</h2>
                            </div>
                          </div>
                        </div>
                      )}
                      {upcoming.length > 6 ? (
                        // Group by time slots when more than 6 matches
                        <div className="space-y-8">
                          {groupMatchesByTimeSlot(
                            upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                          ).map((group, groupIndex) => (
                            <div key={groupIndex}>
                              <div className="mb-6 mt-8">
                                <div className="flex flex-wrap items-baseline">
                                  <h4 className="ml-2 text-base font-semibold text-gray-900 dark:text-white">{group.label}</h4>
                                  <p className="ml-2 truncate text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.matches.map((match) => (
                                  <MatchCard key={match._id} match={match} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Show all matches without grouping when 6 or fewer
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {upcoming
                            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                            .map((match) => (
                              <MatchCard key={match._id} match={match} />
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finished Games */}
                  {finished.length > 0 && (
                    <div>
                      <div className="min-w-0 flex-1">
                        <div className="border-b border-gray-200 pb-5 dark:border-white/10 mb-6">
                          <div className="-mt-2 -ml-2 flex flex-wrap items-baseline">
                            <h2 className="mt-2 ml-2 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">Beendet</h2>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul
                          role="list"
                          className="divide-y divide-gray-100 overflow-hidden bg-white shadow-xs outline-1 outline-gray-900/5 sm:rounded-xl dark:divide-white/5 dark:bg-gray-800/50 dark:shadow-none dark:outline-white/10 dark:sm:-outline-offset-1"
                        >
                          {finished
                            .sort((a, b) => {
                              // First sort by tournament sortOrder
                              const tournamentConfigA = tournamentConfigs[a.tournament.alias];
                              const tournamentConfigB = tournamentConfigs[b.tournament.alias];
                              const sortOrderA = tournamentConfigA?.sortOrder || 999;
                              const sortOrderB = tournamentConfigB?.sortOrder || 999;

                              if (sortOrderA !== sortOrderB) {
                                return sortOrderA - sortOrderB;
                              }

                              // Then sort by startDate (most recent first)
                              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                            })
                            .map((match) => (
                              <li
                                key={match._id}
                                className="relative flex items-center gap-x-4 px-4 py-5 hover:bg-gray-50 sm:px-6 dark:hover:bg-white/2.5"
                              >
                                <div className="flex-shrink-0 w-16">
                                  {(() => {
                                    const item = tournamentConfigs[match.tournament.alias];
                                    if (item) {
                                      return (
                                        <span
                                          className={classNames("inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", item.bdgColLight)}
                                        >
                                          {item.tinyName}
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                                <div className="flex-1 flex items-center justify-end gap-2 pr-4">
                                  <p className="block sm:hidden text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.home.tinyName}
                                  </p>
                                  <p className="hidden sm:max-lg:block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.home.shortName}
                                  </p>
                                  <p className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.home.fullName}
                                  </p>
                                  <Image
                                    src={match.home.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                                    alt={match.home.tinyName}
                                    width={20}
                                    height={20}
                                    className="object-contain flex-shrink-0"
                                  />
                                </div>
                                <div className="flex-shrink-0 w-24 flex items-center justify-center min-h-[48px]">
                                  {match.matchStatus.key === 'FINISHED' ? (
                                    <p className="text-md font-bold text-gray-900 dark:text-white whitespace-nowrap text-center">
                                      {match.home.stats.goalsFor} : {match.away.stats.goalsFor}
                                      {(match.finishType.key === 'SHOOTOUT' || match.finishType.key === 'OVERTIME') && (
                                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-1">
                                          {match.finishType.key === 'SHOOTOUT' ? '(PS)' : '(V)'}
                                        </span>
                                      )}
                                    </p>
                                  ) : (
                                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 lowercase whitespace-nowrap text-center">
                                      {match.matchStatus.value}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-2 pl-4">
                                  <Image
                                    src={match.away.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                                    alt={match.away.tinyName}
                                    width={20}
                                    height={20}
                                    className="object-contain flex-shrink-0"
                                  />
                                  <p className="block sm:hidden text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.away.tinyName}
                                  </p>
                                  <p className="hidden sm:max-lg:block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.away.shortName}
                                  </p>
                                  <p className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {match.away.fullName}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-gray-400 dark:text-gray-500" />
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {filteredMatches.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        {selectedTournament
                          ? `Keine Spiele ${isShowingUpcoming ? 'demnächst' : 'heute'} in ${selectedTournament.name}`
                          : `Keine Spiele ${isShowingUpcoming ? 'demnächst' : 'heute'}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/** Matze */}
            {/**
            <div className="text-center max-w-4xl mx-auto mb-24 sm:mb-36 p-4 sm:p-8 border-4 border-black">
              <div className="mb-6">
                <CldImage
                  src="https://res.cloudinary.com/dajtykxvp/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1744883924/Matze.jpg"
                  alt="Matze"
                  width={175}
                  height={175} // Maintain aspect ratio
                  gravity="face"
                  crop="fill"
                  grayscale
                  className="rounded-full shadow-md"
                />
              </div>
              <div>
                <h1 className="text-lg/6 font-semibold text-gray-900 tracking-tight uppercase font-serif">
                  Lieber Matze
                </h1>
                <div className="mt-5 text-sm/6 text-gray-600">
                  <p className="mt-2">
                    Mit dir verlieren wir eine prägende Persönlichkeit der ersten Stunde.
                    Deine besondere Herzenswärme war für jeden spürbar, der dich umgab.
                    Danke für deinen Einsatz als Spieler, Trainer, Schiedsrichter,
                    Schiedsrichter-Obmann und Vereinsvorsitzenden.
                  </p>
                  <p className="mt-2">
                    Du fehlst, und wir wünschen deiner Familie, Freunden,
                    und dem Verein Red Devils Berlin viel Kraft und alles erdenklich Gute.
                  </p>
                  <p className="mt-2">
                    Wir trauern um einen großen Pionier des Sports.
                  </p>
                  <p className="mt-2 mt-6 sm:mt-6 text-left">
                    Traueranzeige für Matthias Pipke,<br />
                    Red Devils Berlin, im Namen der
                  </p>
                  <div className="mt-3 sm:mt-3 text-left flex flex-col">
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">BISHL</div>
                      <div className="flex-grow">Berliner Inline Skaterhockey Liga</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">ISHD</div>
                      <div className="flex-grow">Inline-Skaterhockey Deutschland</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">IRVB</div>
                      <div className="flex-grow">Inline- und Rollsport-Verband Berlin</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">DRIV</div>
                      <div className="flex-grow">Deutscher Rollsport- und Inline-Verband</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            */}
            <div className="mx-auto max-w-2xl text-center mt-12">
              <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl mb-16">
                Neueste Artikel
              </h2>
              {/**
              <p className="mt-2 text-lg/8 text-gray-600">Learn how to grow your business with our expert advice.</p>
              */}
            </div>
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {postItems.map((post) => (
                <article key={post._id} className="flex flex-col items-start justify-between">
                  <div className="relative w-full">
                    <CldImage
                      alt="Post Thumbnail"
                      src={post.imageUrl ? post.imageUrl : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                      className="w-full rounded-2xl object-cover aspect-[16/9]"
                      layout="responsive"
                      width={1024}
                      height={576}
                      crop="fill"
                      gravity="auto"
                      radius={18}
                      priority
                    />
                  </div>
                  <div className="max-w-xl">
                    <div className="mt-8 flex items-center gap-x-4 text-xs">
                      <time dateTime={post.createDate} className="text-gray-500">
                        {getFuzzyDate(post.createDate)}
                      </time>
                      {/*<a
                        href={post.category.href}
                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                      >
                        {post.category.title}
                      </a>
                      */}
                    </div>
                    <div className="group relative">
                      <h3 className="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600">
                        <Link href={`/posts/${post.alias}`} passHref>
                          <a>
                            <span className="absolute inset-0" />
                            {post.title}
                          </a>
                        </Link>
                      </h3>
                      <div className="mt-5 line-clamp-3 text-sm/6 text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                    </div>
                    <div className="relative mt-8 flex items-center gap-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {`${post.author_firstname[0]}${post.author_lastname[0]}`}
                      </div>
                      <div className="text-sm/6">
                        <p className="font-extralight text-gray-900">
                          <a href="#">
                            <span className="absolute inset-0" />
                            {post.author_firstname}
                          </a>
                        </p>
                        {/*<p className="text-gray-600">{post.author.role}</p>*/}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {postItems.length > 0 && (
              <div className="flex justify-center sm:justify-end w-full mt-20 sm:mt-12">
                <Link href="/posts" passHref>
                  <a className="inline-flex items-center justify-center w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 flex items-center gap-2">
                    Weitere Artikel
                    <ArrowLongRightIcon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

export default Home