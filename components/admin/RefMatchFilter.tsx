
import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/solid';

interface Tournament {
  _id: string;
  name: string;
  alias: string;
}

interface RefMatchFilterProps {
  onFilterChange: (tournament: string) => void;
}

const RefMatchFilter: React.FC<RefMatchFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`)
      .then(response => response.json())
      .then(data => setTournaments(data))
      .catch(error => console.error('Error fetching tournaments:', error));
  }, []);

  const handleFilterChange = (tournamentAlias: string) => {
    setSelectedTournament(tournamentAlias);
    onFilterChange(tournamentAlias);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
        Wettbewerb
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Wettbewerb auswählen
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => handleFilterChange('all')}
                        className={`w-full text-left px-4 py-2 rounded-md ${
                          selectedTournament === 'all' ? 'bg-indigo-100' : 'hover:bg-gray-100'
                        }`}
                      >
                        Alle Wettbewerbe
                      </button>
                      {tournaments.map((tournament) => (
                        <button
                          key={tournament._id}
                          onClick={() => handleFilterChange(tournament.alias)}
                          className={`w-full text-left px-4 py-2 rounded-md ${
                            selectedTournament === tournament.alias ? 'bg-indigo-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          {tournament.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default RefMatchFilter;
