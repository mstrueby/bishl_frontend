
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
  removeButton?: boolean;

}

const PlayerSelect = React.forwardRef<HTMLInputElement, PlayerSelectProps>(({
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  error = false,
  tabIndex,
  removeButton = false
}, ref) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(propSelectedPlayer);
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // When the 'propSelectedPlayer' changes, update the local state
  useEffect(() => {
    setSelectedPlayer(propSelectedPlayer);
    // Update query to show selected player's name when prop changes, or clear when null
    if (propSelectedPlayer) {
      setQuery(`${propSelectedPlayer.player.lastName}, ${propSelectedPlayer.player.firstName}`);
    } else {
      setQuery(''); // Clear the query to show placeholder
    }
  }, [propSelectedPlayer]);

  const [showAllOptions, setShowAllOptions] = useState(false);

  // Filter roster based on query and showAllOptions flag
  const filteredRoster = showAllOptions || query === ''
    ? roster
    : roster.filter((player) => {
      const queryLower = query.toLowerCase().trim();

      // Jersey number search (exact match and starts-with match)
      const jerseyNumber = player.player.jerseyNumber?.toString() || '';
      const jerseyMatch = jerseyNumber === query || jerseyNumber.startsWith(query);

      // Name searches
      const fullName = `${player.player.firstName} ${player.player.lastName}`.toLowerCase();
      const reverseName = `${player.player.lastName}, ${player.player.firstName}`.toLowerCase();
      const nameMatch = fullName.includes(queryLower) || reverseName.includes(queryLower);

      // Combined search (e.g., "12 Smith" or "Smith 12")
      const combinedMatch = `${jerseyNumber} ${fullName}`.includes(queryLower) ||
        `${jerseyNumber} ${reverseName}`.includes(queryLower);

      return jerseyMatch || nameMatch || combinedMatch;
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

  // Add focus method to ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }), []);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setShowAllOptions(false); // Reset to filtered mode when typing

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
    if (!player) return ''; // Return empty string when no player selected to show placeholder
    return `${player.player.jerseyNumber} - ${player.player.lastName}, ${player.player.firstName}`;
  };

  return (
    <>
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
                ref={(el) => {
                  inputRef.current = el;
                  if (typeof ref === 'function') {
                    ref(el);
                  } else if (ref) {
                    ref.current = el;
                  }
                }}
                tabIndex={tabIndex}
                className={`w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ${error ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'} focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                onChange={handleQueryChange}
                value={selectedPlayer ? displayValue(selectedPlayer) : query}
                placeholder={placeholder}
                autoComplete="off"
              />
              <Combobox.Button
                className="absolute inset-y-0 right-0 flex items-center pr-2"
                onClick={() => setShowAllOptions(true)}
              >
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Combobox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => {
                  // Only clear query if no player is selected and query doesn't match any player
                  if (!selectedPlayer && query) {
                    const hasMatchingPlayer = roster.some(player => {
                      const playerName = `${player.player.lastName}, ${player.player.firstName}`;
                      return playerName.toLowerCase().includes(query.toLowerCase()) ||
                        player.player.jerseyNumber?.toString().includes(query);
                    });
                    if (!hasMatchingPlayer) {
                      setQuery('');
                    }
                  }
                }}
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
                    filteredRoster.map((player) => {
                      const isSelected = selectedPlayer?.player.playerId === player.player.playerId;

                      return (
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
                          {({ active }) => (
                            <>
                              <div className={classNames('flex items-center', isSelected ? 'font-semibold' : 'font-normal')}>
                                <span className="w-6 text-center mr-3">{player.player.jerseyNumber}</span>
                                <span className="truncate">{player.player.lastName}, {player.player.firstName}</span>
                              </div>

                              {isSelected ? (
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
                      );
                    })
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </>
        )}
      </Combobox>
      <button
        type="button"
        onClick={() => setSelectedAssistPlayer(null)}
        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
        title="Vorlage entfernen"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </>
  );
});

PlayerSelect.displayName = 'PlayerSelect';

export default PlayerSelect;
