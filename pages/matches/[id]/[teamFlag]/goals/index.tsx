
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { Match, RosterPlayer, Team } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import { CalendarIcon, MapPinIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';


let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface GoalRegisterFormProps {
  jwt: string;
  matchId: string;
  teamFlag: string;
  team: Team;
  initialRoster: RosterPlayer[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, teamFlag } = context.params as { id: string; teamFlag: string };
  const jwt = getCookie('jwt', context);

  if (!jwt || !id || !teamFlag) {
    return { notFound: true };
  }

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    // console.log("user:", user)
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('LEAGUE_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Fetch match data
    const matchResponse = await axios.get(`${BASE_URL}/matches/${id}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      }
    });
    const match: Match = matchResponse.data;
    const matchTeam: Team = teamFlag === 'home' ? match.home : match.away;

    // Roster is obtained directly from the match data
    const roster = matchTeam.roster;

    return {
      props: {
        jwt,
        matchId: id,
        teamFlag,
        team: matchTeam,
        initialRoster: roster || []
      }
    };
  } catch (error) {
    console.error('Error fetching roster data:', error);
    return {
      props: {
        jwt,
        matchId: id,
        teamFlag,
        team: null,
        initialRoster: []
      }
    };
  }
};

const GoalRegisterForm: React.FC<GoalRegisterFormProps> = ({ jwt, matchId, teamFlag, team, initialRoster }) => {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMesssage = () => {
    setError(null);
  }

  const [goals, setGoals] = useState([{
    player: '',
    assist: '',
    time: '',
  }]);

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const values = [...goals];
    values[index][event.target.name as keyof typeof values[0]] = event.target.value;
    setGoals(values);
  };

  const handleAddGoal = () => {
    setGoals([...goals, { player: '', assist: '', time: '' }]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (matchId) {
      try {
        const response = await fetch(`${BASE_URL}/matches/${matchId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({ goals }),
        });

        if (!response.ok) {
          console.error('Failed to save the goal sheet');
        } else {
          console.log('Goal sheet saved successfully');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-4">
        <button
          aria-label="Back button"
          className="flex items-center"
          onClick={() => router.back()}>
          <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
          <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
            Zurück
          </span>
        </button>
        {/* Match Header */}
        <div className="flex items-start justify-between sm:flex-row gap-y-2 p-4 border-b mb-6 sm:mb-8 md:mb-12">
          {/* Refresh Button */}
          {match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'CANCELLED' && (
            <button
              onClick={refreshMatchData}
              disabled={isRefreshing}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              title="Aktualisieren"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Tournament Badge */}
          <div className="">
            {(() => {
              const item = tournamentConfigs[match.tournament.alias];
              if (item) {
                return (
                  <span
                    key={item.tinyName}
                    className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", item.bdgColLight)}
                  >
                    {item.tinyName} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                  </span>
                );
              }
            })()}

          </div>

          {/* Match StartDate, Venue */}
          <div className="flex flex-col items-end gap-y-2">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span className="hidden sm:block text-sm uppercase font-light text-gray-700">
                <time dateTime={
                  match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
                }>
                  {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                    timeZone: 'Europe/Berlin',
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'offen'}
                </time> Uhr
              </span>
              <span className="block sm:hidden text-sm uppercase font-light text-gray-700">
                <time dateTime={
                  match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
                }>
                  {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                    timeZone: 'Europe/Berlin',
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'offen'}
                </time>
              </span>
            </div>
            <div className="flex items-center truncate">
              <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
              <p className="text-sm uppercase font-light text-gray-700 truncate">{match.venue.name}</p>
            </div>
          </div>
        </div>

        {/* Match Title */}
        {/* Teams and Score */}
        <div className="flex justify-between items-center">
          {/* Home Team */}
          <div className="text-center w-1/3">
            <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
              <CldImage
                src={match.home.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                alt={match.home.tinyName}
                width={100}
                height={100}
                gravity="center"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="block sm:hidden text-xl font-bold truncate">{match.home.tinyName}</h2>
            <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.home.shortName}</h2>
            <h2 className="hidden md:block text-xl font-bold truncate">{match.home.fullName}</h2>
          </div>

          {/* Score */}
          <div className="text-center w-1/3">
            <div className="mb-2 sm:mb-4">
              <MatchStatusBadge
                statusKey={match.matchStatus.key}
                finishTypeKey={match.finishType.key}
                statusValue={match.matchStatus.value}
                finishTypeValue={match.finishType.value}
              />
            </div>
            {(() => {
              switch (match.matchStatus.key) {
                case 'SCHEDULED':
                case 'CANCELLED':
                  return null;
                default:
                  return (
                    <div className="text-2xl sm:text-4xl font-bold space-x-1 sm:space-x-4">
                      <span>{match.home.stats.goalsFor}</span>
                      <span>:</span>
                      <span>{match.away.stats.goalsFor}</span>
                    </div>
                  );
              }
            })()}
          </div>

          {/* Away Team */}
          <div className="text-center w-1/3">
            <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
              <CldImage
                src={match.away.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                alt={match.away.tinyName}
                width={100}
                height={100}
                gravity="center"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="block sm:hidden text-xl font-bold truncate">{match.away.tinyName}</h2>
            <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.away.shortName}</h2>
            <h2 className="hidden md:block text-xl font-bold truncate">{match.away.fullName}</h2>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">Tore: {team.fullName} / {team.name}</h1>

        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
        {error && <ErrorMessage error={error} onClose={handleCloseErrorMesssage} />}

        <form onSubmit={handleSubmit}>
          {goals.map((goal, index) => (
            <div key={index}>
              <label>
                Player:
                <select
                  name="player"
                  value={goal.player}
                  onChange={(event) => handleInputChange(index, event)}
                >
                  <option value="">Select a player</option>
                  {roster.map((rosterPlayer) => (
                    <option
                      key={rosterPlayer.player.playerId}
                      value={rosterPlayer.player.playerId}
                    >
                      #{rosterPlayer.player.jerseyNumber} {rosterPlayer.player.firstName} {rosterPlayer.player.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assist:
                <select
                  name="assist"
                  value={goal.assist}
                  onChange={(event) => handleInputChange(index, event)}
                >
                  <option value="">Select a player</option>
                  {roster.map((rosterPlayer) => (
                    <option
                      key={rosterPlayer.player.playerId}
                      value={rosterPlayer.player.playerId}
                    >
                      #{rosterPlayer.player.jerseyNumber} {rosterPlayer.player.firstName} {rosterPlayer.player.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Time (min):
                <input
                  type="number"
                  name="time"
                  value={goal.time}
                  onChange={(event) => handleInputChange(index, event)}
                />
              </label>
            </div>
          ))}
          <button type="button" onClick={handleAddGoal}>Add Goal</button>
          <button type="submit">Save Goals</button>
        </form>
      </div>
    </Layout>
  );
};

export default GoalRegisterForm;
