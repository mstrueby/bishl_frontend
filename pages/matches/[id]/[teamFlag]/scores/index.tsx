
import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { Match, RosterPlayer, Team } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import { CalendarIcon, MapPinIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import MatchHeader from '../../../../../components/ui/MatchHeader';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface GoalRegisterFormProps {
  jwt: string;
  match: Match;
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
        match,
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
        match: null,
        teamFlag,
        team: null,
        initialRoster: []
      }
    };
  }
};

const GoalRegisterForm: React.FC<GoalRegisterFormProps> = ({ jwt, match: initialMatch, teamFlag, team, initialRoster }) => {
  const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [match, setMatch] = useState<Match>(initialMatch);

  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Refresh match data function
  const handleRefreshMatch = useCallback(async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`);
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing match data:', error);
      setIsRefreshing(false);
    }
  }, [id, isRefreshing]);

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
    if (match._id) {
      try {
        const response = await fetch(`${BASE_URL}/matches/${match._id}`, {
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

        <MatchHeader
          match={match}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshMatch}
        />
        
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
