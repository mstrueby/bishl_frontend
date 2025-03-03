import React, { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import axios from 'axios';
import Layout from '../../../../../components/Layout';
import { getCookie } from 'cookies-next';
import { Match, RosterPlayer } from '../../../../../types/MatchValues';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import { PlayerValues, Assignment, AssignmentTeam } from '../../../../../types/PlayerValues';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../../../../tools/utils';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['API_URL'];

interface AvailablePlayer {
    _id: string,
    firstName: string,
    lastName: string,
    displayFirstName: string,
    displayLastName: string,
    position: string,
    fullFaceReq: boolean,
    source: string,
    imageUrl: string,
    imageVisible: boolean,
    passNo: string,
    jerseyNo: number | undefined,
    called: boolean,
}

interface RosterPageProps {
    jwt: string;
    match: Match;
    club: ClubValues;
    team: TeamValues;
    roster: RosterPlayer[];
    rosterPublished: boolean;
    teamFlag: string;
    availablePlayers: AvailablePlayer[];
    allAvailablePlayers: AvailablePlayer[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id, teamFlag } = context.params as { id: string; teamFlag: string };
    const jwt = getCookie('jwt', context);
    if (!jwt || !id || !teamFlag)
        return { notFound: true };
    try {
        // First check if user has required role
        const userResponse = await axios.get(`${BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        });

        const user = userResponse.data;
        // console.log("user:", user)
        if (!user.roles?.includes('ADMIN') && !user.roles?.includes('CLUB_ADMIN')) {
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
        //console.log("match", matchResponse.data)
        const match: Match = await matchResponse.data;

        // Determine which team's roster to fetch
        const matchTeam = teamFlag === 'home' ? match.home : match.away;

        // get club object
        const clubResponse = await axios.get(`${BASE_URL}/clubs/${matchTeam.clubAlias}`);
        const club: ClubValues = await clubResponse.data;

        // get team object
        const teamResponse = await axios.get(`${BASE_URL}/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`);
        const team: TeamValues = await teamResponse.data;

        // Fetch available players
        const teamPlayerResponse = await axios.get(
            `${BASE_URL}/players/clubs/${matchTeam.clubAlias}/teams/${matchTeam.teamAlias}`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            params: {
                sortby: 'lastName',
                active: 'true'
            }
        }
        );
        const teamPlayerResult = teamPlayerResponse.data.results;
        const teamPlayers = Array.isArray(teamPlayerResult) ? teamPlayerResult : [];

        // Debug log to check what's coming back
        console.log("Team players count:", teamPlayers.length);

        // loop through assignedTeams.clubs[].teams in availablePlayers to find team with teamId=matchTeam.teamId. get passNo and jerseyNo
        const availablePlayers = teamPlayers.map((teamPlayer: PlayerValues) => {
            // Check if assignedTeams exists and is an array
            if (!teamPlayer.assignedTeams || !Array.isArray(teamPlayer.assignedTeams)) {
                console.log("Player missing assignedTeams:", teamPlayer._id);
                return null;
            }

            // Find the team assignment that matches the target team ID
            const assignedTeam = teamPlayer.assignedTeams
                .flatMap((assignment: Assignment) => assignment.teams || [])
                .find((team: AssignmentTeam) => team && team.teamId === matchTeam.teamId);

            return assignedTeam ? {
                _id: teamPlayer._id,
                firstName: teamPlayer.firstName,
                lastName: teamPlayer.lastName,
                displayFirstName: teamPlayer.displayFirstName,
                displayLastName: teamPlayer.displayLastName,
                position: teamPlayer.position || 'Skater',
                fullFaceReq: teamPlayer.fullFaceReq,
                source: teamPlayer.source,
                imageUrl: teamPlayer.imageUrl,
                imageVisible: teamPlayer.imageVisible,
                passNo: assignedTeam.passNo,
                jerseyNo: assignedTeam.jerseyNo,
                called: false
            } : null;
        }).filter((player: AvailablePlayer | null) => player !== null);

        // Keep both the full list and a filtered list of available players
        const rosterPlayerIds = (matchTeam.roster || []).map(rp => rp.player.playerId);
        const filteredAvailablePlayers = availablePlayers.filter(player =>
            !rosterPlayerIds.includes(player?._id ?? '')
        );

        console.log("All available players:", availablePlayers.length);
        console.log("Filtered available players for roster:", filteredAvailablePlayers.length);

        return {
            props: {
                jwt,
                match,
                club,
                team,
                roster: matchTeam.roster || [],
                rosterPublished: matchTeam.rosterPublished || false,
                teamFlag,
                availablePlayers: filteredAvailablePlayers || [],
                allAvailablePlayers: availablePlayers || [],
            }
        };

    } catch (error) {
        console.error('Error fetching data:', error);
        return {
            notFound: true
        };
    }
};



// Player position options
const playerPositions = [
    { key: 'C', value: 'Captain' },
    { key: 'A', value: 'Assistant' },
    { key: 'G', value: 'Goalie' },
    { key: 'F', value: 'Feldspieler' },
];

const RosterPage = ({ jwt, match, club, team, roster, rosterPublished: initialRosterPublished, teamFlag, availablePlayers = [], allAvailablePlayers = [] }: RosterPageProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [savingRoster, setSavingRoster] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayer | null>(null);
    const [playerNumber, setPlayerNumber] = useState<number>(0);
    const [playerPosition, setPlayerPosition] = useState(playerPositions[3]); // Default to 'F' (Feldspieler)
    const [availablePlayersList, setAvailablePlayersList] = useState<AvailablePlayer[]>(availablePlayers || []);
    const [rosterPublished, setRosterPublished] = useState<boolean>(initialRosterPublished);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<RosterPlayer | null>(null);
    const [editPlayerNumber, setEditPlayerNumber] = useState<number>(0);
    const [editPlayerPosition, setEditPlayerPosition] = useState(playerPositions[3]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isCallUpModalOpen, setIsCallUpModalOpen] = useState(false);
    const [callUpTeams, setCallUpTeams] = useState<TeamValues[]>([]);
    const [selectedCallUpTeam, setSelectedCallUpTeam] = useState<TeamValues | null>(null);
    const [callUpPlayers, setCallUpPlayers] = useState<AvailablePlayer[]>([]);
    const [selectedCallUpPlayer, setSelectedCallUpPlayer] = useState<AvailablePlayer | null>(null);
    const [callUpModalError, setCallUpModalError] = useState<string | null>(null);

    // Handler to close the success message
    const handleCloseSuccessMessage = () => {
        setSuccessMessage(null);
    };
    const handleCloseErrorMesssage = () => {
        setError(null);
    }

    const handleCloseModalError = () => {
        setModalError(null);
    };

    // Fetch teams from the same club with the same age group
    useEffect(() => {
        if (isCallUpModalOpen && club && team) {
            // Filter teams from the same club with the same age group and a lower team number, but not the current team
            const fetchTeams = async () => {
                try {
                    const teamsResponse = await axios.get(`${BASE_URL}/clubs/${club.alias}/teams/`, {
                        headers: {
                            Authorization: `Bearer ${jwt}`,
                        }
                    });
                    const filteredTeams = teamsResponse.data.filter((t: TeamValues) =>
                        t.ageGroup === team.ageGroup && t._id !== team._id && t.active && t.teamNumber > team.teamNumber
                    );
                    setCallUpTeams(filteredTeams);
                } catch (error) {
                    console.error('Error fetching teams:', error);
                    setCallUpModalError('Fehler beim Laden der Teams');
                }
            };

            fetchTeams();
        }
    }, [isCallUpModalOpen, club, team, jwt]);

    // Sort roster by position order: C, A, G, F, then by jersey number
    const sortRoster = (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
        return [...rosterToSort].sort((a, b) => {
            // Define position priorities (C = 1, A = 2, G = 3, F = 4)
            const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

            // Get priorities
            const posA = positionPriority[a.playerPosition.key] || 99;
            const posB = positionPriority[b.playerPosition.key] || 99;

            // First sort by position priority
            if (posA !== posB) {
                return posA - posB;
            }

            // If positions are the same, sort by jersey number
            return a.player.jerseyNumber - b.player.jerseyNumber;
        });
    };

    // Fetch players when a team is selected
    const [rosterList, setRosterList] = useState<RosterPlayer[]>(sortRoster(roster || []));

    // Fetch players when a team is selected
    useEffect(() => {
        if (selectedCallUpTeam) {
            const fetchPlayers = async () => {
                try {
                    const playersResponse = await axios.get(
                        `${BASE_URL}/players/clubs/${club.alias}/teams/${selectedCallUpTeam.alias}`, {
                        headers: {
                            Authorization: `Bearer ${jwt}`,
                        },
                        params: {
                            sortby: 'lastName',
                            active: 'true'
                        }
                    });

                    const players = playersResponse.data.results || [];

                    // Format the players to match the AvailablePlayer interface
                    const formattedPlayers = players.map((player: PlayerValues) => {
                        // Find the team assignment for the selected team
                        const assignedTeam = player.assignedTeams
                            ?.flatMap((assignment: Assignment) => assignment.teams || [])
                            .find((team: AssignmentTeam) => team && team.teamId === selectedCallUpTeam._id);

                        return {
                            _id: player._id,
                            firstName: player.firstName,
                            lastName: player.lastName,
                            displayFirstName: player.displayFirstName,
                            displayLastName: player.displayLastName,
                            position: player.position || 'Skater',
                            fullFaceReq: player.fullFaceReq,
                            source: player.source,
                            imageUrl: player.imageUrl,
                            imageVisible: player.imageVisible,
                            passNo: assignedTeam?.passNo || '',
                            jerseyNo: assignedTeam?.jerseyNo,
                            called: true
                        };
                    }).filter((player: AvailablePlayer | null) => player !== null);

                    // Filter out players that are already in the roster
                    const rosterPlayerIds = rosterList.map(rp => rp.player.playerId);
                    const filteredPlayers = formattedPlayers.filter((player: AvailablePlayer) =>
                        !rosterPlayerIds.includes(player._id)
                    );

                    setCallUpPlayers(filteredPlayers);
                } catch (error) {
                    console.error('Error fetching players:', error);
                    setCallUpModalError('Fehler beim Laden der Spieler');
                    setCallUpPlayers([]);
                }
            };

            fetchPlayers();
        } else {
            setCallUpPlayers([]);
            setSelectedCallUpPlayer(null);
        }
    }, [selectedCallUpTeam, club, jwt, rosterList]);

    // Handle adding the selected call-up player to the available players list
    const handleConfirmCallUp = () => {
        if (!selectedCallUpPlayer) {
            setCallUpModalError('Bitte wähle einen Spieler aus');
            return;
        }

        // Check if the player is already in the available players list
        if (availablePlayersList.some(p => p._id === selectedCallUpPlayer._id)) {
            setCallUpModalError('Dieser Spieler ist bereits in der Liste verfügbar');
            return;
        }

        // Make sure the called attribute is set to true
        const playerWithCalled = {
            ...selectedCallUpPlayer,
            called: true
        };

        // Add the player to the available players list
        setAvailablePlayersList(prev => [...prev, playerWithCalled]);

        // Close the modal and reset selections
        setIsCallUpModalOpen(false);
        setSelectedCallUpTeam(null);
        setSelectedCallUpPlayer(null);
        setCallUpModalError(null);

        // Optional: Show a success message
        setSuccessMessage(`Spieler ${selectedCallUpPlayer.firstName} ${selectedCallUpPlayer.lastName} wurde hochgemeldet und steht zur Verfügung.`);
    };

    const handleEditPlayer = (player: RosterPlayer) => {
        setEditingPlayer(player);
        setEditPlayerNumber(player.player.jerseyNumber);
        // Find the position in playerPositions that matches the player's position
        const position = playerPositions.find(pos => pos.key === player.playerPosition.key);
        setEditPlayerPosition(position || playerPositions[3]); // Default to 'F' if not found
        setModalError(null); // Clear any modal errors when opening the dialog
        setError(null)
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingPlayer) return;

        // Check if trying to change to Captain when another player is already Captain
        if (editPlayerPosition.key === 'C' &&
            rosterList.some(player =>
                player.playerPosition.key === 'C' &&
                player.player.playerId !== editingPlayer.player.playerId
            )) {
            setModalError('Es kann nur ein Spieler als Captain (C) gekennzeichnet werden');
            return;
        }

        // Check if trying to change to Assistant when another player is already Assistant
        if (editPlayerPosition.key === 'A' &&
            rosterList.some(player =>
                player.playerPosition.key === 'A' &&
                player.player.playerId !== editingPlayer.player.playerId
            )) {
            setModalError('Es kann nur ein Spieler als Assistant (A) gekennzeichnet werden');
            return;
        }

        // Check if trying to add more than 2 Goalies
        if (editPlayerPosition.key === 'G' && editingPlayer.playerPosition.key !== 'G') {
            const goalieCount = rosterList.filter(player => player.playerPosition.key === 'G').length;
            if (goalieCount >= 2) {
                setModalError('Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden');
                return;
            }
        }

        // Check if trying to add more than 14 Feldspieler
        if (editPlayerPosition.key === 'F' && editingPlayer.playerPosition.key !== 'F') {
            const feldspielerCount = rosterList.filter(player => player.playerPosition.key === 'F').length;
            if (feldspielerCount >= 14) {
                setModalError('Es können maximal 14 Feldspieler (F) eingetragen werden');
                return;
            }
        }

        const updatedRoster = rosterList.map(player => {
            if (player.player.playerId === editingPlayer.player.playerId) {
                return {
                    ...player,
                    player: {
                        ...player.player,
                        jerseyNumber: editPlayerNumber
                    },
                    playerPosition: editPlayerPosition
                };
            }
            return player;
        });

        setRosterList(sortRoster(updatedRoster));
        setIsEditModalOpen(false);
        setEditingPlayer(null);
        setModalError(null);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingPlayer(null);
        setModalError(null);
    };

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
            setError('Wähle einen Spieler aus');
            return;
        }

        // Check if trying to add a Captain when one already exists
        if (playerPosition.key === 'C' && rosterList.some(player => player.playerPosition.key === 'C')) {
            setError('Es kann nur ein Spieler als Captain (C) gekennzeichnet werden');
            return;
        }

        // Check if trying to add an Assistant when one already exists
        if (playerPosition.key === 'A' && rosterList.some(player => player.playerPosition.key === 'A')) {
            setError('Es kann nur ein Spieler als Assistant (A) gekennzeichnet werden');
            return;
        }

        // Check if trying to add more than 2 Goalies
        if (playerPosition.key === 'G') {
            const goalieCount = rosterList.filter(player => player.playerPosition.key === 'G').length;
            if (goalieCount >= 2) {
                setError('Es können maximal 2 Spieler als Goalie (G) gekennzeichnet werden');
                return;
            }
        }

        // Check if trying to add more than 14 Feldspieler
        if (playerPosition.key === 'F') {
            const feldspielerCount = rosterList.filter(player => player.playerPosition.key === 'F').length;
            if (feldspielerCount >= 14) {
                setError('Es können maximal 14 Feldspieler (F) eingetragen werden');
                return;
            }
        }

        // Set playerNumber to the jerseyNo from playerDetails if it exists and playerNumber is not set
        if (!playerNumber) {
            // Find the player in playerDetails
            const playerDetail = availablePlayers.find(player => player._id === selectedPlayer._id);
            if (playerDetail && playerDetail.jerseyNo) {
                setPlayerNumber(playerDetail.jerseyNo);
            }
        }

        setLoading(true);

        try {
            // Here you would normally make an API call to save the player to the roster
            // For now, we'll just update the local state
            const newPlayer: RosterPlayer = {
                player: {
                    playerId: selectedPlayer._id,
                    firstName: selectedPlayer.firstName,
                    lastName: selectedPlayer.lastName,
                    jerseyNumber: playerNumber,
                },
                playerPosition: {
                    key: playerPosition.key,
                    value: playerPosition.value,
                },
                passNumber: selectedPlayer.passNo,
                called: selectedPlayer.called || false
            };

            // Add player to roster
            const updatedRoster = [...rosterList, newPlayer];

            // Sort roster by position order: C, A, G, F, then by jersey number
            const sortedRoster = updatedRoster.sort((a, b) => {
                // Define position priorities (C = 1, A = 2, G = 3, F = 4)
                const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };

                // Get priorities
                const posA = positionPriority[a.playerPosition.key] || 99;
                const posB = positionPriority[b.playerPosition.key] || 99;

                // First sort by position priority
                if (posA !== posB) {
                    return posA - posB;
                }

                // If positions are the same, sort by jersey number
                return a.player.jerseyNumber - b.player.jerseyNumber;
            });

            setRosterList(sortedRoster);

            // Remove the selected player from the available players list
            if (selectedPlayer) {
                setAvailablePlayersList(prevList =>
                    prevList.filter(player => player._id !== selectedPlayer._id)
                );
            }

            // Reset form
            setSelectedPlayer(null);
            setPlayerNumber(0);
            setPlayerPosition(playerPositions[3]); // Reset to 'F' (Feldspieler)
            setError('');

            // Here you would make the actual API call to update the roster
            /*
            await axios.post(`${BASE_URL}/matches/${match._id}/roster/${teamFlag}`, {
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
            setError('Failed to add player to roster');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRoster = async () => {
        //if (rosterList.length === 0) {
        //    setError('Cannot save an empty roster');
        //    return;
        //}

        setSavingRoster(true);
        setError('');

        try {
            // Prepare the data to be sent
            const rosterData = {
                roster: rosterList,
                published: rosterPublished
            };

            // Make the API call to save the roster
            const rosterResponse = await axios.put(`${BASE_URL}/matches/${match._id}/${teamFlag}/roster/`, rosterList, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    'Content-Type': 'application/json'
                }
            });

            // Make API call to save further roster attributes
            const publishResponse = await axios.patch(`${BASE_URL}/matches/${match._id}`, {
                [teamFlag]: {
                    rosterPublished: rosterPublished
                }
            }, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                }
            });

            // Show success message or redirect
            setError('');
            // You could add a success message here if needed
        } catch (error) {
            // Ignore 304 Not Modified errors as they're not actual errors
            if (axios.isAxiosError(error) && error.response?.status === 304) {
                console.log('Match not changed (304 Not Modified), continuing normally');
                setSuccessMessage('Aufstellung erfolgreich gespeichert.');
            } else {
                console.error('Error saving roster/match:', error);
                setError('Aufstellung konnte nicht gespeichert werden.');
            }
        } finally {
            console.log("Roster successfully changed");
            setSavingRoster(false);
            // Set success message if no error occurred
            if (!error) {
                setSuccessMessage('Aufstellung erfolgreich gespeichert.');
            }
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold mb-6">Mannschaftsaufstellung: {team.fullName} / {team.name}</h1>

                {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

                {/* Add Player Form */}
                <div className="bg-white shadow rounded-md border p-4 mb-6">
                    <h2 className="text-lg font-medium mb-4">Spieler aufstellen</h2>

                    {error && <ErrorMessage error={error} onClose={handleCloseErrorMesssage} />}

                    <div className="flex flex-col gap-4">
                        {/* Player Selection */}
                        <div className="">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Spieler
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCallUpModalOpen(true)}
                                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                    Hochmelden
                                </button>
                            </div>
                            <Listbox value={selectedPlayer} onChange={setSelectedPlayer}>
                                {({ open }) => (
                                    <>
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                <span className="block truncate">
                                                    {selectedPlayer ? `${selectedPlayer.lastName}, ${selectedPlayer.firstName}` : 'Spieler auswählen'}
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
                                                    {Array.isArray(availablePlayersList) && availablePlayersList.length > 0 ? (
                                                        availablePlayersList.map((player) => (
                                                            <Listbox.Option
                                                                key={player._id}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                                        'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                    )
                                                                }
                                                                value={player}
                                                                onClick={() => {
                                                                    if (player.jerseyNo) {
                                                                        setPlayerNumber(player.jerseyNo);
                                                                    }
                                                                }}
                                                            >
                                                                {({ selected, active }) => (
                                                                    <>
                                                                        <span className={classNames(
                                                                            selected ? 'font-semibold' : 'font-normal',
                                                                            'block truncate'
                                                                        )}>
                                                                            {player.lastName}, {player.firstName}
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
                                                            Keine Spieler verfügbar
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
                        <div className="flex flex-row justify-between items-center mb-1">
                            <div>
                                <label htmlFor="player-number" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nr.
                                </label>
                                <input
                                    type="text"
                                    id="player-number"
                                    value={playerNumber}
                                    onChange={(e) => setPlayerNumber(parseInt(e.target.value) || 0)}
                                    className="block w-16 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="##"
                                />
                            </div>

                            {/* Player Position */}
                            <div className="w-full ml-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Position
                                </label>
                                <Listbox value={playerPosition} onChange={setPlayerPosition}>
                                    {({ open }) => (
                                        <>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                    <span className="block truncate">
                                                        {playerPosition.key} - {playerPosition.value}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </span>
                                                </Listbox.Button>

                                                <Transition
                                                    show={open}
                                                    as={Fragment}
                                                    leave="transition ease-in duration-100"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                        {playerPositions.map((position) => (
                                                            <Listbox.Option
                                                                key={position.key}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                                        'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                    )
                                                                }
                                                                value={position}
                                                            >
                                                                {({ selected, active }) => (
                                                                    <>
                                                                        <span className={classNames(
                                                                            selected ? 'font-semibold' : 'font-normal',
                                                                            'block truncate'
                                                                        )}>
                                                                            {position.key} - {position.value}
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
                                                        ))}
                                                    </Listbox.Options>
                                                </Transition>
                                            </div>
                                        </>
                                    )}
                                </Listbox>
                            </div>
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
                            Hinzufügen
                        </button>
                    </div>
                </div>

                {/* Roster List */}
                <h3 className="mt-8 text-lg font-medium text-gray-900">Aufstellung</h3>
                <div className="bg-white shadow-md rounded-md border-2 mt-4">
                    <ul className="divide-y divide-gray-200">
                        {rosterList.length > 0 ? (
                            rosterList.map((player) => (
                                <li key={player.player.playerId} className={`px-6 py-4 ${player.player.jerseyNumber === 0 ? 'bg-yellow-50' : ''}`}>
                                    <div className="flex items-center">
                                        <div className={`min-w-8 md:min-w-12 text-sm font-semibold ${player.player.jerseyNumber === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {player.player.jerseyNumber}
                                        </div>
                                        <div className="min-w-8 md:min-w-12 text-sm font-medium text-gray-500">
                                            {player.playerPosition.key}
                                        </div>
                                        <div className="flex-1 text-sm text-gray-900">
                                            {player.player.lastName}, {player.player.firstName}
                                        </div>
                                        <div className="flex-1 hidden sm:block flex-1 text-xs text-gray-500">
                                            {player.passNumber}
                                        </div>
                                        <div className="flex-1 text-sm text-gray-500 ml-6 md:ml-0">
                                            {player.called ? (
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="hidden sm:block">Hochgemeldet</span>
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEditPlayer(player)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Find the player in the complete list of all players
                                                    const playerToAddBack = allAvailablePlayers.find(p => p._id === player.player.playerId);

                                                    // Remove from roster
                                                    const updatedRoster = rosterList.filter(p => p.player.playerId !== player.player.playerId);
                                                    setRosterList(updatedRoster);

                                                    // Add back to available players list if found and not already there
                                                    if (playerToAddBack && !availablePlayersList.some(p => p._id === playerToAddBack._id)) {
                                                        setAvailablePlayersList(prevList => {
                                                            // Add the player back and sort the list by lastName, then firstName
                                                            const newList = [...prevList, playerToAddBack];
                                                            return newList.sort((a, b) => {
                                                                // First sort by lastName
                                                                const lastNameComparison = a.lastName.localeCompare(b.lastName);
                                                                // If lastName is the same, sort by firstName
                                                                return lastNameComparison !== 0 ? lastNameComparison :
                                                                    a.firstName.localeCompare(b.firstName);
                                                            });
                                                        });
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-6 py-4 text-center text-gray-500">
                                Keine Spieler in der Aufstellung
                            </li>
                        )}
                    </ul>
                </div>

                {/* Publish toggle and save button */}
                {/* Roster Completeness Check */}
                <div className="mt-8 bg-white shadow rounded-md border p-6">
                    <h3 className="text-base font-semibold mb-4">Check:</h3>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'C') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {rosterList.some(player => player.playerPosition.key === 'C') ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className="ml-2 text-sm">
                                {rosterList.some(player => player.playerPosition.key === 'C')
                                    ? 'Captain (C) wurde festgelegt'
                                    : 'Es wurde noch kein Captain (C) festgelegt'}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'A') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {rosterList.some(player => player.playerPosition.key === 'A') ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className="ml-2 text-sm">
                                {rosterList.some(player => player.playerPosition.key === 'A')
                                    ? 'Assistant (A) wurde festgelegt'
                                    : 'Es wurde noch kein Assistant (A) festgelegt'}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${rosterList.some(player => player.playerPosition.key === 'G') ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {rosterList.some(player => player.playerPosition.key === 'G') ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className="ml-2 text-sm">
                                {rosterList.some(player => player.playerPosition.key === 'G')
                                    ? 'Mindestens ein Goalie (G) wurde festgelegt'
                                    : 'Es wurde noch kein Goalie (G) festgelegt'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="relative inline-flex items-center">
                            <div className="flex items-center h-6">
                                {/* Check if all required conditions are met */}
                                {(() => {
                                    const hasZeroJerseyNumber = rosterList.some(player => player.player.jerseyNumber === 0);
                                    const hasCaptain = rosterList.some(player => player.playerPosition.key === 'C');
                                    const hasAssistant = rosterList.some(player => player.playerPosition.key === 'A');
                                    const hasGoalie = rosterList.some(player => player.playerPosition.key === 'G');

                                    // All checks must pass to enable the checkbox
                                    const allChecksPass = !hasZeroJerseyNumber && hasCaptain && hasAssistant && hasGoalie;

                                    return (
                                        <input
                                            id="rosterPublished"
                                            type="checkbox"
                                            className={`h-4 w-4 rounded border-gray-300 ${allChecksPass ? 'text-indigo-600' : 'text-gray-400 bg-gray-100'} focus:ring-indigo-600`}
                                            checked={rosterPublished}
                                            onChange={(e) => {
                                                if (allChecksPass) {
                                                    setRosterPublished(e.target.checked);
                                                }
                                            }}
                                            disabled={!allChecksPass}
                                        />
                                    );
                                })()}
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="rosterPublished" className={`font-medium ${(() => {
                                    const hasZeroJerseyNumber = rosterList.some(player => player.player.jerseyNumber === 0);
                                    const hasCaptain = rosterList.some(player => player.playerPosition.key === 'C');
                                    const hasAssistant = rosterList.some(player => player.playerPosition.key === 'A');
                                    const hasGoalie = rosterList.some(player => player.playerPosition.key === 'G');

                                    return !hasZeroJerseyNumber && hasCaptain && hasAssistant && hasGoalie ? 'text-gray-900' : 'text-gray-400';
                                })()} `}>Veröffentlichen</label>
                                <p className="text-gray-500">
                                    {(() => {
                                        const hasZeroJerseyNumber = rosterList.some(player => player.player.jerseyNumber === 0);
                                        const hasCaptain = rosterList.some(player => player.playerPosition.key === 'C');
                                        const hasAssistant = rosterList.some(player => player.playerPosition.key === 'A');
                                        const hasGoalie = rosterList.some(player => player.playerPosition.key === 'G');

                                        if (hasZeroJerseyNumber) {
                                            return 'Behebe zuerst alle Fehler in der Aufstellung (markierte Zeilen)';
                                        } else if (!hasCaptain || !hasAssistant || !hasGoalie) {
                                            return 'Stelle sicher, dass ein Captain (C), ein Assistant (A) und mindestens ein Goalie (G) festgelegt ist';
                                        } else {
                                            return 'Aufstellung öffentlich sichtbar machen';
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3 mt-6 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Schließen
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveRoster}
                        disabled={loading || savingRoster}
                        className="w-24 inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {savingRoster ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                            </svg>
                        ) : (
                            'Speichern'
                        )}
                    </button>
                </div>
            </div>

            {/* Edit Player Modal */}
            {isEditModalOpen && editingPlayer && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Spieler bearbeiten: {editingPlayer.player.lastName}, {editingPlayer.player.firstName}
                        </h3>

                        {/* Jersey Number */}
                        <div className="mb-4">
                            <label htmlFor="edit-player-number" className="block text-sm font-medium text-gray-700 mb-1">
                                Jersey Number
                            </label>
                            <input
                                type="text"
                                id="edit-player-number"
                                value={editPlayerNumber}
                                onChange={(e) => setEditPlayerNumber(parseInt(e.target.value) || 0)}
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="##"
                            />
                        </div>

                        {/* Player Position */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position
                            </label>
                            <Listbox value={editPlayerPosition} onChange={setEditPlayerPosition}>
                                {({ open }) => (
                                    <>
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                <span className="block truncate">
                                                    {editPlayerPosition.key} - {editPlayerPosition.value}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </Listbox.Button>

                                            <Transition
                                                show={open}
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {playerPositions.map((position) => (
                                                        <Listbox.Option
                                                            key={position.key}
                                                            className={({ active }) =>
                                                                classNames(
                                                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                                    'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                )
                                                            }
                                                            value={position}
                                                        >
                                                            {({ selected, active }) => (
                                                                <>
                                                                    <span className={classNames(
                                                                        selected ? 'font-semibold' : 'font-normal',
                                                                        'block truncate'
                                                                    )}>
                                                                        {position.key} - {position.value}
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
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Listbox>
                        </div>

                        {modalError && <ErrorMessage error={modalError} onClose={handleCloseModalError} />}

                        {/* Modal Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Call-Up Player Modal */}
            {isCallUpModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Spieler aus anderer Mannschaft hinzufügen
                        </h3>

                        {callUpModalError && (
                            <div className="rounded-md bg-red-50 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{callUpModalError}</h3>
                                    </div>
                                    <div className="ml-auto pl-3">
                                        <div className="-mx-1.5 -my-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setCallUpModalError(null)}
                                                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                <span className="sr-only">Dismiss</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Team
                            </label>
                            <Listbox value={selectedCallUpTeam} onChange={setSelectedCallUpTeam}>
                                {({ open }) => (
                                    <>
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                <span className="block truncate">
                                                    {selectedCallUpTeam ? selectedCallUpTeam.name : 'Mannschaft auswählen'}
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
                                                    {callUpTeams.length > 0 ? (
                                                        callUpTeams.map((teamItem) => (
                                                            <Listbox.Option
                                                                key={teamItem._id}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                                                        'relative cursor-default select-none py-2 pl-3 pr-9'
                                                                    )
                                                                }
                                                                value={teamItem}
                                                            >
                                                                {({ selected, active }) => (
                                                                    <>
                                                                        <span className={classNames(
                                                                            selected ? 'font-semibold' : 'font-normal',
                                                                            'block truncate'
                                                                        )}>
                                                                            {teamItem.name}
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
                                                            Keine Mannschaften verfügbar
                                                        </div>
                                                    )}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Listbox>
                        </div>

                        {/* Player Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Spieler
                            </label>
                            <Listbox value={selectedCallUpPlayer} onChange={setSelectedCallUpPlayer}>
                                {({ open }) => (
                                    <>
                                        <div className="relative">
                                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                                <span className="block truncate">
                                                    {selectedCallUpPlayer ? `${selectedCallUpPlayer.lastName}, ${selectedCallUpPlayer.firstName}` : 'Spieler auswählen'}
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
                                                    {callUpPlayers.length > 0 ? (
                                                        callUpPlayers.map((player) => (
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
                                                                            {player.lastName}, {player.firstName}
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
                                                            {selectedCallUpTeam ? 'Keine Spieler verfügbar' : 'Bitte zuerst eine Mannschaft auswählen'}
                                                        </div>
                                                    )}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Listbox>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCallUpModalOpen(false);
                                    setSelectedCallUpTeam(null);
                                    setSelectedCallUpPlayer(null);
                                    setCallUpModalError(null);
                                }}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCallUp}
                                disabled={!selectedCallUpPlayer}
                                className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${selectedCallUpPlayer
                                    ? 'bg-indigo-600 hover:bg-indigo-500'
                                    : 'bg-indigo-300 cursor-not-allowed'
                                    }`}
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default RosterPage;