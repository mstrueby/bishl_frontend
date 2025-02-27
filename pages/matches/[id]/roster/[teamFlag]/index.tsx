
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Match } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import { PlayerValues } from '../../../../../types/PlayerValues';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../../../../tools/utils';

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
    availablePlayers: PlayerValues[];
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

        // Fetch available players
        const availablePlayersResponse = await axios.get(
            `${process.env.API_URL}/players/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            }
        }
        );
        const availablePlayersResult = await availablePlayersResponse.data.results;
        const availablePlayers = Array.isArray(availablePlayersResult) ? availablePlayersResult : [];

        return {
            props: {
                jwt,
                match,
                club,
                team,
                roster: [],
                teamFlag,
                availablePlayers: availablePlayers || [],
            }
        };

    } catch (error) {
        console.error('Error fetching data:', error);
        return {
            notFound: true
        };
    }
};



const RosterPage = ({ jwt, match, club, team, roster, teamFlag, availablePlayers }: RosterPageProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerValues | null>(null);
    const [playerNumber, setPlayerNumber] = useState('');
    const [rosterList, setRosterList] = useState<Player[]>(roster);
    const [errorMessage, setErrorMessage] = useState('');

    if (loading) {
        return <Layout><div>Loading...</div></Layout>;
    }

    if (!match) {
        return <Layout><div>Match not found</div></Layout>;
    }

    // Filter out players that are already in the roster
    //const availablePlayers = allPlayers.filter(player => 
    //    !rosterList.some(rp => rp.id === player._id)
    //);

    const handleAddPlayer = async () => {
        if (!selectedPlayer) {
            setErrorMessage('Please select a player');
            return;
        }
        
        if (!playerNumber) {
            setErrorMessage('Please enter a player number');
            return;
        }

        setLoading(true);
        
        try {
            // Here you would normally make an API call to save the player to the roster
            // For now, we'll just update the local state
            const newPlayer: Player = {
                id: selectedPlayer._id,
                firstName: selectedPlayer.firstName,
                lastName: selectedPlayer.lastName,
                number: playerNumber
            };
            
            // Add player to roster
            const updatedRoster = [...rosterList, newPlayer];
            setRosterList(updatedRoster);
            
            // Reset form
            setSelectedPlayer(null);
            setPlayerNumber('');
            setErrorMessage('');

            // Here you would make the actual API call to update the roster
            /*
            await axios.post(`${process.env.API_URL}/matches/${match._id}/roster/${teamFlag}`, {
                playerId: selectedPlayer._id,
                playerNumber: playerNumber
            }, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                }
            });
            */
            
        } catch (error) {
            console.error('Error adding player to roster:', error);
            setErrorMessage('Failed to add player to roster');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold mb-6">Team Roster: {team.fullName}</h1>
                
                {/* Add Player Form */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium mb-4">Add Player to Roster</h2>
                    
                    {errorMessage && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                            {errorMessage}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Player Selection */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Player
                            </label>
                            <Listbox value={selectedPlayer} onChange={setSelectedPlayer}>
                                {({ open }) => (
                                    <>
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                <span className="block truncate">
                                                    {selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : 'Select a player'}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </Listbox.Button>

                                            <Transition
                                                show={open}
                                                as={React.Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {availablePlayers.length > 0 ? (
                                                        availablePlayers.map((player) => (
                                                            <Listbox.Option
                                                                key={player._id}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                                        'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                    )
                                                                }
                                                                value={player}
                                                            >
                                                                {({ selected, active }) => (
                                                                    <>
                                                                        <span className={classNames(
                                                                            selected ? 'font-semibold' : 'font-normal',
                                                                            'block truncate'
                                                                        )}>
                                                                            {player.firstName} {player.lastName}
                                                                        </span>

                                                                        {selected ? (
                                                                            <span
                                                                                className={classNames(
                                                                                    active ? 'text-white' : 'text-indigo-600',
                                                                                    'absolute inset-y-0 right-0 flex items-center pr-4'
                                                                                )}
                                                                            >
                                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                            </span>
                                                                        ) : null}
                                                                    </>
                                                                )}
                                                            </Listbox.Option>
                                                        ))
                                                    ) : (
                                                        <div className="py-2 px-3 text-gray-500 italic">
                                                            No available players
                                                        </div>
                                                    )}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Listbox>
                        </div>
                        
                        {/* Jersey Number */}
                        <div>
                            <label htmlFor="player-number" className="block text-sm font-medium text-gray-700 mb-1">
                                Jersey Number
                            </label>
                            <input
                                type="text"
                                id="player-number"
                                value={playerNumber}
                                onChange={(e) => setPlayerNumber(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="##"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleAddPlayer}
                            disabled={loading}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add to Roster
                        </button>
                    </div>
                </div>
                
                {/* Roster List */}
                <div className="bg-white shadow rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {rosterList.length > 0 ? (
                            rosterList.map((player) => (
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
                            ))
                        ) : (
                            <li className="px-6 py-4 text-center text-gray-500">
                                No players in roster
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </Layout>
    );
};

export default RosterPage;
