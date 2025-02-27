
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Match } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    number: string;
}

interface RosterPageProps {
    match: Match;
    roster: Player[];
    teamFlag: string;
}

const RosterPage = ({ match, roster, teamFlag }: RosterPageProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id, teamFlag } = context.params as { id: string; teamFlag: string };
    
    try {
        // Fetch match data
        const matchResponse = await fetch(`${process.env.API_URL}/matches/${id}`);
        
        if (!matchResponse.ok) {
            return { 
                notFound: true 
            };
        }
        
        const match: Match = await matchResponse.json();
        
        // Determine which team's roster to fetch
        const team = teamFlag === 'home' ? match.home : match.away;
        
        // Fetch roster data
        const rosterResponse = await fetch(
            `${process.env.API_URL}/players/clubs/${team.clubAlias}/teams/${team.teamAlias}`
        );
        
        if (!rosterResponse.ok) {
            // Return match but with empty roster if roster fetch fails
            return {
                props: {
                    match,
                    roster: [],
                    teamFlag
                }
            };
        }
        
        const rosterData = await rosterResponse.json();
        const roster = Array.isArray(rosterData) ? rosterData : [];
        
        return {
            props: {
                match,
                roster,
                teamFlag
            }
        };
        
    } catch (error) {
        console.error('Error fetching data:', error);
        return { 
            notFound: true 
        };
    }
};

export default RosterPage;
