import { Listbox } from '@headlessui/react';
import { useState, useEffect } from 'react';

const ClubListbox = () => {
    const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
    const [selectedClub, setSelectedClub] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await fetch('/tournaments');
                const data = await response.json();
                setClubs(data);
                if (data.length > 0) {
                    setSelectedClub(data[0]);
                }
            } catch (error) {
                console.error('Error fetching tournaments:', error);
            }
        };
        fetchTournaments();
    }, []);

    return (
        <Listbox value={selectedClub} onChange={setSelectedClub}>
            <Listbox.Button>
                {selectedClub && 'name' in selectedClub ? selectedClub.name : 'Select Tournament'}
            </Listbox.Button>
            <Listbox.Options>
                {clubs.map((tournament) => (
                    <Listbox.Option key={tournament.id} value={tournament}>
                        {tournament.name}
                    </Listbox.Option>
                ))}
            </Listbox.Options>
        </Listbox>
    );
};

export default ClubListbox;