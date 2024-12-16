
import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/solid';
import TournamentSelect from '../ui/TournamentSelect';
import type { TournamentValues } from '../../types/TournamentValues';

interface RefMatchFilterProps {
  onFilterChange: (tournament: string) => void;
}

const RefMatchFilter: React.FC<RefMatchFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentValues[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentValues | null>(null);
  const [tempSelectedTournament, setTempSelectedTournament] = useState<TournamentValues | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`)
      .then(response => response.json())
      .then(data => setTournaments(data))
      .catch(error => console.error('Error fetching tournaments:', error));
  }, []);

  const handleApplyFilter = () => {
    setSelectedTournament(tempSelectedTournament);
    onFilterChange(tempSelectedTournament?.alias || 'all');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedTournament(selectedTournament);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
        Filter
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCancel}>
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Wettbewerb auswählen
                  </Dialog.Title>
                  
                  <TournamentSelect
                    selectedTournament={tempSelectedTournament}
                    onTournamentChange={setTempSelectedTournament}
                    allTournamentsData={tournaments}
                  />

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={handleCancel}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={handleApplyFilter}
                    >
                      Anwenden
                    </button>
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
