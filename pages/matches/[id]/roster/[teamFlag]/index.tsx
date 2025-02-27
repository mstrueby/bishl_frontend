
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Match } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    number: string;
}

interface RosterPageProps {
    jwt: string;
    match: Match;
    club: ClubValues;
    team: TeamValues;
    roster: Player[];
    teamFlag: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id, teamFlag } = context.params as { id: string; teamFlag: string };
    const jwt = getCookie('jwt', context);
    if (!jwt || !id || !teamFlag)
        return { notFound: true };
    try {
        // Fetch match data
        const matchResponse = await axios.get(`${process.env.API_URL}/matches/${id}`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            }
        });
        const match: Match = await matchResponse.data;

        // Determine which team's roster to fetch
        const matchTeam = teamFlag === 'home' ? match.home : match.away;

        // get club object
        const clubResponse = await axios.get(`${process.env.API_URL}/clubs/${matchTeam.clubAlias}`);
        const club: ClubValues = await clubResponse.data;
        
        // get team object
        const teamResponse = await axios.get(`${process.env.API_URL}/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`);
        const team: TeamValues = await teamResponse.data;

        // Fetch roster data
        const rosterResponse = await axios.get(
            `${process.env.API_URL}/players/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            }
        }
        );
        const rosterData = await rosterResponse.data.results;
        const roster = Array.isArray(rosterData) ? rosterData : [];

        return {
            props: {
                jwt,
                match,
                club,
                team,
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



const RosterPage = ({ jwt, match, club, team, roster, teamFlag }: RosterPageProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (loading) {
        return <Layout><div>Loading...</div></Layout>;
    }

    if (!match) {
        return <Layout><div>Match not found</div></Layout>;
    }

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
