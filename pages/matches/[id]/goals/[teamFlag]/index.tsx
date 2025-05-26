
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { RosterPlayer } from '../../../../types/MatchValues';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface GoalRegisterFormProps {
    jwt: string;
    matchId: string;
    teamFlag: string;
    initialRoster: RosterPlayer[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id, teamFlag } = context.params as { id: string; teamFlag: string };
    const jwt = getCookie('jwt', context);

    if (!jwt || !id || !teamFlag) {
        return { notFound: true };
    }

    try {
        // Fetch roster data for the team
        const rosterResponse = await axios.get(`${BASE_URL}/matches/${id}/${teamFlag}/roster`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        return {
            props: {
                jwt,
                matchId: id,
                teamFlag,
                initialRoster: rosterResponse.data || []
            }
        };
    } catch (error) {
        console.error('Error fetching roster data:', error);
        return {
            props: {
                jwt,
                matchId: id,
                teamFlag,
                initialRoster: []
            }
        };
    }
};

const GoalRegisterForm: React.FC<GoalRegisterFormProps> = ({ jwt, matchId, teamFlag, initialRoster }) => {
    const router = useRouter();
    const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);

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
    );
};

export default GoalRegisterForm;
