import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { FunnelIcon } from '@heroicons/react/24/solid';
import TournamentSelect from '../ui/TournamentSelect';
import type { TournamentValues } from '../../types/TournamentValues';

interface RefMatchFilterProps {
  onFilterChange: (filter: { tournament: string, showUnassignedOnly: boolean }) => void;
}

const RefMatchFilter: React.FC<RefMatchFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentValues[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentValues | null>(null);
  const [tempSelectedTournament, setTempSelectedTournament] = useState<TournamentValues | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`)
      .then(response => response.json())
      .then(data => setTournaments(data))
      .catch(error => console.error('Error fetching tournaments:', error));
  }, []);

  const handleApplyFilter = () => {
    setSelectedTournament(tempSelectedTournament);
    onFilterChange({
      tournament: tempSelectedTournament?.alias || 'all',
      showUnassignedOnly
    });
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
        <Dialog as="div" className="fixed inset-0 z-10" onClose={handleCancel}>
          <div className="fixed inset-0 bg-black/30 transition-opacity"></div>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Spiele filtern
                </Dialog.Title>
                
                <TournamentSelect
                  selectedTournament={tempSelectedTournament}
                  onTournamentChange={setTempSelectedTournament}
                  allTournamentsData={tournaments}
                />

                <div className="mt-4 flex items-center">
                  <Switch
                    checked={showUnassignedOnly}
                    onChange={setShowUnassignedOnly}
                    className={`${
                      showUnassignedOnly ? 'bg-indigo-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                  >
                    <span className="sr-only">Nur offene Spiele anzeigen</span>
                    <span
                      aria-hidden="true"
                      className={`${
                        showUnassignedOnly ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                  <span className="ml-3 text-sm text-gray-900">Nur offene Spiele</span>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setTempSelectedTournament(null);
                      setSelectedTournament(null);
                      setShowUnassignedOnly(false);
                      onFilterChange({ tournament: 'all', showUnassignedOnly: false });
                      setIsOpen(false);
                    }}
                  >
                    Filter zurücksetzen
                  </button>
                  <div className="flex space-x-3">
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