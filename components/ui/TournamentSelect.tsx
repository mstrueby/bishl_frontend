import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { TournamentValues } from '../../types/TournamentValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface TournamentSelectProps {
  selectedTournament: TournamentValues | null;
  onTournamentChange: (tournament: TournamentValues) => void;
  allTournamentsData: TournamentValues[];
}
const TournamentSelect: React.FC<TournamentSelectProps> = ({ 
  selectedTournament: propSelectedTournament,
  onTournamentChange, 
  allTournamentsData 
}) => {
  const [selectedTournament, setSelectedTournament] = useState<TournamentValues | null>(propSelectedTournament);

  // When the 'propSelectedTournament' changes, update the local state
  useEffect(() => {
    setSelectedTournament(propSelectedTournament);
  }, [propSelectedTournament]);

  
  // Placeholder component for the listbox
  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Listbox value={selectedTournament} onChange={(tournament) => {
      setSelectedTournament(tournament);
      if (tournament) {
        onTournamentChange(tournament);
      }
    }}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900  md:px-6 lg:px-8">Wettbewerb:</Listbox.Label>
          <div className="relative mt-2 mb-4 md:px-6 lg:px-8">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {selectedTournament ? (
                  <span className="ml-3 block truncate">{selectedTournament.name}</span>
                ) : (
                  <Placeholder />
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
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
              <Listbox.Options className="absolute z-10 mt-1 max-h-[60vh] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm md:px-6 lg:px-8">
                {allTournamentsData?.map((tournament) => (
                  <Listbox.Option
                    key={tournament._id}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={tournament}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">

                          <span
                            className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                          >
                            {tournament.name}
                          </span>
                        </div>

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
  );
};
export default TournamentSelect;