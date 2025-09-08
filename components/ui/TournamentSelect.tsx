import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { TournamentValues } from '../../types/TournamentValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { classNames } from '../../tools/utils';
import { tournamentConfigs } from '../../tools/consts';
import Image from 'next/image';

interface TournamentSelectProps {
  selectedTournament: TournamentValues | null;
  onTournamentChange: (tournament: TournamentValues | null) => void;
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
    <span className="flex items-center">
      <div className="w-16 flex flex-col items-center">
        <div className="w-8 h-8 relative">
          <Image
            src="https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
            alt="BISHL Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <span className="ml-3 block truncate text-gray-400">Alle Wettbewerbe</span>
    </span>
  );

  return (
    <Listbox value={selectedTournament} onChange={(tournament) => {
      setSelectedTournament(tournament);
      onTournamentChange(tournament);
    }}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">Wettbewerb</Listbox.Label>
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              {selectedTournament ? (
                <span className="flex items-center">
                  {(() => {
                    const item = tournamentConfigs[selectedTournament.alias];
                    if (item) {
                      return (
                        <span
                          key={item.tinyName}
                          className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset mr-4", item.bdgColLight)}
                        >
                          {item.tinyName}
                        </span>
                      );
                    }
                  })()}
                  <span className="block truncate">{selectedTournament.name}</span>
                </span>
              ) : (
                <Placeholder />
              )}
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
              <Listbox.Options className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {/* All Tournaments option */}
                <Listbox.Option
                  key="all-tournaments"
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                  value={null}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <div className="w-16 flex flex-col items-center">
                          <div className="w-8 h-8 relative">
                            <Image
                              src="https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                              alt="BISHL Logo"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <span
                          className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                        >
                          Alle Wettbewerbe
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={classNames(
                            active ? 'text-white' : 'text-indigo-600',
                            'absolute inset-y-0 right-0 flex items-center pr-4'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
                
                
                {allTournamentsData
                  ?.filter(tournament => tournamentConfigs[tournament.alias]?.active)
                  ?.sort((a, b) => (tournamentConfigs[a.alias]?.sortOrder || 0) - (tournamentConfigs[b.alias]?.sortOrder || 0))
                  ?.map((tournament) => (
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
                          {(() => {
                            const item = tournamentConfigs[tournament.alias];
                            if (item) {
                              return (
                                <div className="w-16 flex flex-col items-center">
                                  <span
                                    key={item.tinyName}
                                    className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", item.bdgColLight)}
                                  >
                                    {item.tinyName}
                                  </span>
                                </div>
                              );
                            }
                          })()}
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
      )
      }
    </Listbox >
  );
};
export default TournamentSelect;