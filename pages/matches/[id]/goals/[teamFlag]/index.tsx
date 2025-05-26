import React, { useState } from 'react';
import { useRouter } from 'next/router';

const GoalRegisterForm = () => {
    const router = useRouter();
    const { id } = router.query;

    const [goals, setGoals] = useState([{
        player: '',
        assist: '',
        time: '',
    }]);

    const players = ['Player 1', 'Player 2', 'Player 3']; // placeholder for players list, usually fetched from API

    const handleInputChange = (index, event) => {
        const values = [...goals];
        values[index][event.target.name] = event.target.value;
        setGoals(values);
    };

    const handleAddGoal = () => {
        setGoals([...goals, { player: '', assist: '', time: '' }]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (id) {
            try {
                const response = await fetch(`/matches/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ goals }),
                });

                if (!response.ok) {
                    // Handle error
                    console.error('Failed to save the goal sheet');
                } else {
                    // Reset or redirect after successful submission
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
                            {players.map((player) => (
                                <option key={player} value={player}>{player}</option>
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
                            {players.map((player) => (
                                <option key={player} value={player}>{player}</option>
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