
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Match } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    number: string;
}

const RosterPage = () => {
    const router = useRouter();
    const { id, teamFlag } = router.query;
    const [match, setMatch] = useState<Match | null>(null);
    const [roster, setRoster] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchMatchAndRoster = async () => {
                try {
                    // Fetch match data
                    const matchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`);
                    const matchData: Match = await matchResponse.json();
                    setMatch(matchData);

                    // Determine which team's roster to fetch
                    const team = teamFlag === 'home' ? matchData.home : matchData.away;
                    
                    // Fetch roster data
                    const rosterResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/players/clubs/${team.clubAlias}/teams/${team.teamAlias}`
                    );
                    const rosterData = await rosterResponse.json();
                    setRoster(Array.isArray(rosterData) ? rosterData : []);
                    
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchMatchAndRoster();
        }
    }, [id, teamFlag]);

    if (loading) {
        return <Layout><div>Loading...</div></Layout>;
    }

    if (!match) {
        return <Layout><div>Match not found</div></Layout>;
    }

    const team = teamFlag === 'home' ? match.home : match.away;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold mb-6">Team Roster: {team.fullName}</h1>
                <div className="bg-white shadow rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {roster.map((player) => (
                            <li key={player.id} className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="min-w-12 text-sm font-medium text-gray-900">
                                        #{player.number}
                                    </div>
                                    <div className="flex-1 text-sm text-gray-900">
                                        {player.firstName} {player.lastName}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
};

export default RosterPage;
