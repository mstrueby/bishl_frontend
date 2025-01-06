import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { FunnelIcon as FunnelIconOutline } from '@heroicons/react/24/outline';
import { FunnelIcon as FunnelIconSolid } from '@heroicons/react/24/solid';
import TournamentSelect from '../ui/TournamentSelect';
import type { TournamentValues } from '../../types/TournamentValues';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
registerLocale('de', de);

interface RefMatchFilterProps {
  onFilterChange: (filter: { tournament: string; showUnassignedOnly: boolean; date_from?: string; date_to?: string }) => void;
}

const RefMatchFilter: React.FC<RefMatchFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentValues[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentValues | null>(null);
  const [tempSelectedTournament, setTempSelectedTournament] = useState<TournamentValues | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

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
      showUnassignedOnly,
      date_from: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      date_to: endDate ? new Date(endDate.setHours(23, 59, 59)).toISOString().split('T')[0] : undefined
    });
    setIsOpen(false);
  };

  // Store initial values when opening the modal
  const [initialValues, setInitialValues] = useState({
    tournament: null,
    dateRange: [new Date(), null] as [Date | null, Date | null],
    showUnassignedOnly: false
  });

  useEffect(() => {
    if (isOpen) {
      setInitialValues({
        tournament: selectedTournament,
        dateRange: dateRange,
        showUnassignedOnly: showUnassignedOnly
      });
      setTempSelectedTournament(selectedTournament);
    }
  }, [isOpen]);

  const handleCancel = () => {
    setTempSelectedTournament(initialValues.tournament);
    setDateRange(initialValues.dateRange);
    setShowUnassignedOnly(initialValues.showUnassignedOnly);
    setIsOpen(false);
  };

  const handleResetFilter = () => {
    setTempSelectedTournament(null);
    setSelectedTournament(null);
    setShowUnassignedOnly(false);
    setDateRange([null, null]);
    onFilterChange({ 
      tournament: 'all', 
      showUnassignedOnly: false,
      date_from: new Date().toISOString().split('T')[0]
    });
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        {(selectedTournament || showUnassignedOnly || endDate || (startDate && startDate.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0])) ? (
          <FunnelIconSolid className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
        ) : (
          <FunnelIconOutline className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
        )}
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
                      <span className="sr-only">Nur offene Spiele</span>
                      <span
                        aria-hidden="true"
                        className={`${
                          showUnassignedOnly ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                    <span className="ml-3 text-sm text-gray-900">Nur offene Spiele</span>
                  </div>

                  <div className="mt-4">
                    <label className="text-gray-700 text-sm font-bold mb-2">Datumsbereich:</label>
                    <div className="mt-1">
                      <DatePicker
                        showIcon={true}
                        toggleCalendarOnIconClick={true}
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => setDateRange(update)}
                        dateFormat="dd.MM.yyyy"
                        isClearable={true}
                        className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-10 [&>div]:w-full"
                        placeholderText="(Zeitraum auswählen)"
                        locale="de"
                        calendarStartDay={1}
                      />
                    </div>
                  </div>


                  <div className="mt-6 flex justify-end items-center">
                    <button
                      type="button"
                      className="text-sm text-indigo-600 hover:underline mr-3"
                      onClick={handleResetFilter}
                    >
                      Reset
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