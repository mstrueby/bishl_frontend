import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const RosterPage = () => {
    const router = useRouter();
    const { id, teamFlag } = router.query;
    const [roster, setRoster] = useState([]);

    useEffect(() => {
        if (id && teamFlag) {
            // Fetch the roster data based on the match id and teamFlag (home/away)
            const fetchRoster = async () => {
                try {
                    const response = await fetch(`/api/matches/${id}/roster/${teamFlag}`);
                    const data = await response.json();
                    setRoster(data);
                } catch (error) {
                    console.error('Error fetching roster:', error);
                }
            };

            fetchRoster();
        }
    }, [id, teamFlag]);

    return (
        <div>
            <h1>{teamFlag === 'home' ? 'Home' : 'Away'} Team Roster for Match {id}</h1>
            <ul>
                {roster.map((player) => (
                    <li key={player.id}>{player.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default RosterPage;