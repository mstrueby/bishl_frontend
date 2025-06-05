
import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Combobox, Transition } from '@headlessui/react';
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
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // When the 'propSelectedPlayer' changes, update the local state
  useEffect(() => {
    setSelectedPlayer(propSelectedPlayer);
    // Update query to show selected player's name when prop changes
    if (propSelectedPlayer) {
      setQuery(`${propSelectedPlayer.player.lastName}, ${propSelectedPlayer.player.firstName}`);
    } else {
      setQuery('');
    }
  }, [propSelectedPlayer]);

  // Filter roster based on query
  const filteredRoster = query === ''
    ? roster
    : roster.filter((player) => {
        const jerseyMatch = player.player.jerseyNumber?.toString().includes(query);
        const nameMatch = `${player.player.firstName} ${player.player.lastName}`.toLowerCase().includes(query.toLowerCase());
        const reverseNameMatch = `${player.player.lastName}, ${player.player.firstName}`.toLowerCase().includes(query.toLowerCase());
        return jerseyMatch || nameMatch || reverseNameMatch;
      });

  const handlePlayerChange = (player: RosterPlayer | null) => {
    setSelectedPlayer(player);
    onChange(player);
    
    if (player) {
      setQuery(`${player.player.lastName}, ${player.player.firstName}`);
    } else {
      setQuery('');
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    // If user types a jersey number and there's an exact match, auto-select it
    if (value && /^\d+$/.test(value)) {
      const jerseyNumber = parseInt(value);
      const exactMatch = roster.find(player => player.player.jerseyNumber === jerseyNumber);
      if (exactMatch && value.length <= 2) { // Limit to 2 digits for jersey numbers
        handlePlayerChange(exactMatch);
        return;
      }
    }

    // If query doesn't match current selection, clear selection
    if (selectedPlayer) {
      const currentPlayerName = `${selectedPlayer.player.lastName}, ${selectedPlayer.player.firstName}`;
      if (!currentPlayerName.toLowerCase().includes(value.toLowerCase()) && 
          !selectedPlayer.player.jerseyNumber?.toString().includes(value)) {
        setSelectedPlayer(null);
        onChange(null);
      }
    }
  };

  const displayValue = (player: RosterPlayer | null) => {
    if (!player) return '';
    return `${player.player.lastName}, ${player.player.firstName}`;
  };

  return (
    <Combobox value={selectedPlayer} onChange={handlePlayerChange}>
      {({ open }) => (
        <>
          {label && (
            <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900">
              {label}
            </Combobox.Label>
          )}
          <div className="relative">
            <Combobox.Input
              ref={inputRef}
              tabIndex={tabIndex}
              className={`w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ${error ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'} focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
              onChange={handleQueryChange}
              displayValue={displayValue}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery('')}
            >
              <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredRoster.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    Kein Spieler gefunden.
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    Niemand verfügbar.
                  </div>
                ) : (
                  filteredRoster.map((player) => (
                    <Combobox.Option
                      key={player.player.playerId}
                      className={({ active }) =>
                        classNames(
                          'relative cursor-default select-none py-2 pl-3 pr-9',
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                        )
                      }
                      value={player}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className={classNames('flex items-center', selected ? 'font-semibold' : 'font-normal')}>
                            <span className="w-6 text-center mr-3">{player.player.jerseyNumber}</span>
                            <span className="truncate">{player.player.lastName}, {player.player.firstName}</span>
                          </div>

                          {selected ? (
                            <span
                              className={classNames(
                                'absolute inset-y-0 right-0 flex items-center pr-4',
                                active ? 'text-white' : 'text-indigo-600'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </>
      )}
    </Combobox>
  );
};

export default PlayerSelect;
