import { Listbox } from '@headlessui/react';
import { useState, useEffect } from 'react';

const TournamentListbox = () => {
    const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await fetch('/tournaments');
                const data = await response.json();
                setTournaments(data);
                if (data.length > 0) {
                    setSelectedTournament(data[0]);
                }
            } catch (error) {
                console.error('Error fetching tournaments:', error);
            }
        };
        fetchTournaments();
    }, []);

    return (
        <Listbox value={selectedTournament} onChange={setSelectedTournament}>
            <Listbox.Button>
                {selectedTournament && 'name' in selectedTournament ? selectedTournament.name : 'Select Tournament'}
            </Listbox.Button>
            <Listbox.Options>
                {tournaments.map((tournament) => (
                    <Listbox.Option key={tournament.id} value={tournament}>
                        {tournament.name}
                    </Listbox.Option>
                ))}
            </Listbox.Options>
        </Listbox>
    );
};

export default TournamentListbox;