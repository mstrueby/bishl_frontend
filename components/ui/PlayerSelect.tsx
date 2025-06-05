
import React, { Fragment, useState, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { RosterPlayer, EventPlayer } from '../../types/MatchValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { classNames } from '../../tools/utils';

interface PlayerSelectProps {
  selectedPlayer: RosterPlayer | null;
  onChange: (selectedPlayer: RosterPlayer | null) => void;
  roster: RosterPlayer[];
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: boolean;
  tabIndex?: number;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  error = false,
  tabIndex,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(propSelectedPlayer);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredRoster, setFilteredRoster] = useState<RosterPlayer[]>(roster);

  // When the 'propSelectedPlayer' changes, update the local state
  useEffect(() => {
    setSelectedPlayer(propSelectedPlayer);
  }, [propSelectedPlayer]);

  // Update filtered roster when search query or roster changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRoster(roster);
    } else {
      const filtered = roster.filter(player => {
        const jerseyMatch = player.player.jerseyNumber?.toString().includes(searchQuery);
        const nameMatch = `${player.player.firstName} ${player.player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        return jerseyMatch || nameMatch;
      });
      setFilteredRoster(filtered);
    }
  }, [searchQuery, roster]);

  const handlePlayerChange = (player: RosterPlayer | null) => {
    setSelectedPlayer(player);
    onChange(player);
    setSearchQuery(''); // Clear search when player is selected
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If user types a jersey number and there's an exact match, auto-select it
    if (value && /^\d+$/.test(value)) {
      const jerseyNumber = parseInt(value);
      const exactMatch = roster.find(player => player.player.jerseyNumber === jerseyNumber);
      if (exactMatch && value.length <= 2) { // Limit to 2 digits for jersey numbers
        handlePlayerChange(exactMatch);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredRoster(roster);
  };

  const Placeholder = () => (
    <span className={`block truncate ${error ? 'text-red-300' : 'text-gray-400'}`}>{placeholder}</span>
  );

  return (
    <Listbox value={selectedPlayer} onChange={handlePlayerChange}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
              {label}
            </Listbox.Label>
          )}
          <div className="relative">
            <Listbox.Button 
              tabIndex={tabIndex}
              className={`relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ${error ? 'ring-red-300' : 'ring-gray-300'} focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-50 text-red-900' : 'focus:ring-indigo-500 text-gray-900'} sm:text-sm sm:leading-6`}>
              {selectedPlayer ? (
                <div className="flex items-center block truncate">
                  <span className="w-4 text-center">{selectedPlayer.player?.jerseyNumber}</span>
                  <span className="ml-4">{selectedPlayer.player?.lastName}, {selectedPlayer.player?.firstName}</span>
                </div>
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
              <Listbox.Options className="absolute z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {/* Search Input */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Nr. oder Name eingeben..."
                      className="block w-full pl-9 pr-8 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSearch();
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Player Options */}
                {filteredRoster?.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                    {searchQuery ? 'Kein Spieler gefunden' : 'Niemand verfügbar'}
                  </div>
                ) : (
                  filteredRoster?.map((player) => (
                    <Listbox.Option
                      key={player.player.playerId}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 px-3'
                        )
                      }
                      value={player}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className={classNames(selected ? 'font-semibold' : 'font-normal', 'flex items-center block truncate')}>
                            <span className="w-4 text-center">{player.player.jerseyNumber}</span>
                            <span className="ml-4">{player.player.lastName}, {player.player.firstName}</span>
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
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );

};

export default PlayerSelect;
