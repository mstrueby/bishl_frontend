import React, { Fragment, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useField, useFormikContext } from 'formik';
import { Combobox, Transition } from '@headlessui/react';
import { RosterPlayer } from '../../types/MatchValues';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { MinusCircleIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../tools/utils';

interface RosterPlayerSelectProps {
  name: string;
  selectedPlayer: RosterPlayer | null;
  onChange: (selectedPlayer: RosterPlayer | null) => void;
  roster: RosterPlayer[];
  label?: string;
  required?: boolean;
  placeholder?: string;
  tabIndex?: number;
  removeButton?: boolean;
  showErrorText?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface RosterPlayerSelectHandle {
  focus: () => void;
}

// Internal component that uses Formik hooks
const FormikRosterPlayerSelect = forwardRef<RosterPlayerSelectHandle, RosterPlayerSelectProps>(({
  name,
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  tabIndex,
  removeButton = false,
  showErrorText = true,
  disabled = false,
  loading = false,
}, ref) => {
  const [field, meta, helpers] = useField(name);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(propSelectedPlayer);
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
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
    if (helpers && helpers.setValue) {
      helpers.setValue(player);
    }
    if (helpers && helpers.setTouched) {
      helpers.setTouched(true);
    }

    if (player) {
      setQuery(`${player.player.lastName}, ${player.player.firstName}`);
    } else {
      setQuery('');
    }
  };

  // Add focus method to ref
  useImperativeHandle(ref, () => ({
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

    // Only clear selection if the input is completely empty
    if (value === '' && selectedPlayer) {
      setSelectedPlayer(null);
      onChange(null);
      if (helpers && helpers.setValue) {
        helpers.setValue(null);
      }
    }
  };

  const displayValue = (player: RosterPlayer | null) => {
    if (!player) return ''; // Return empty string when no player selected to show placeholder
    return `${player.player.jerseyNumber} - ${player.player.lastName}, ${player.player.firstName}`;
  };

  return (
    <div className="w-full">
      <Combobox value={selectedPlayer} onChange={handlePlayerChange} disabled={disabled || loading}>
        {({ open }) => (
          <>
            {label && (
              <Combobox.Label className="block mt-6 mb-2 text-sm font-medium text-gray-900">
                {label}
              </Combobox.Label>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Combobox.Input
                  ref={inputRef}
                  tabIndex={tabIndex}
                  className={classNames(
                    `relative w-full cursor-default rounded-md border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm`,
                    disabled || loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' : meta.touched && meta.error ? 'bg-white text-red-900 border-red-300 focus:border-red-500 focus:ring-red-500 placeholder:text-red-300' : 'bg-white text-gray-900 border-gray-300 focus:border-indigo-500 focus:ring-indigo-600'
                  )}
                  onChange={handleQueryChange}
                  value={selectedPlayer ? displayValue(selectedPlayer) : query}
                  placeholder={loading ? "Lade Spieler..." : placeholder}
                  autoComplete="off"
                  disabled={disabled || loading}
                  onFocus={() => {
                    if (!disabled && !loading) {
                      setShowAllOptions(true);
                      setIsOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsOpen(false), 200);
                  }}
                />
                {loading ? (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                <Combobox.Button
                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                  onClick={() => {
                    if (!disabled && !loading) {
                      setShowAllOptions(true);
                      setIsOpen(!isOpen);
                    }
                  }}
                >
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>
                )}

              <Transition
                  show={isOpen}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
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
                  <Combobox.Options 
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
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
                            onClick={() => setIsOpen(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePlayerChange(player);
                                setIsOpen(false);
                              }
                            }}
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
              {removeButton && selectedPlayer && (
                <button
                  type="button"
                  onClick={() => handlePlayerChange(null)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md border border-gray-300 shadow-sm transition-colors flex-shrink-0"
                  title="Spieler entfernen"
                >
                  <MinusCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
      </Combobox>
      {showErrorText && meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
});

// Standalone component that doesn't use Formik hooks
const StandaloneRosterPlayerSelect = forwardRef<RosterPlayerSelectHandle, RosterPlayerSelectProps>(({
  name,
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  tabIndex,
  removeButton = false,
  showErrorText = true,
  disabled = false,
  loading = false,
}, ref) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(propSelectedPlayer);
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
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
  useImperativeHandle(ref, () => ({
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

    // Only clear selection if the input is completely empty
    if (value === '' && selectedPlayer) {
      setSelectedPlayer(null);
      onChange(null);
    }
  };

  const displayValue = (player: RosterPlayer | null) => {
    if (!player) return ''; // Return empty string when no player selected to show placeholder
    return `${player.player.jerseyNumber} - ${player.player.lastName}, ${player.player.firstName}`;
  };

  return (
    <div className="w-full">
      <Combobox value={selectedPlayer} onChange={handlePlayerChange} disabled={disabled || loading}>
        {({ open }) => (
          <>
            {label && (
              <Combobox.Label className="block mt-6 mb-2 text-sm font-medium text-gray-900">
                {label}
              </Combobox.Label>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Combobox.Input
                  ref={inputRef}
                  tabIndex={tabIndex}
                  className={classNames(
                    "relative w-full cursor-default rounded-md border border-gray-300 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-600 sm:text-sm",
                    disabled || loading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-900"
                  )}
                  onChange={handleQueryChange}
                  value={selectedPlayer ? displayValue(selectedPlayer) : query}
                  placeholder={loading ? "Lade Spieler..." : placeholder}
                  autoComplete="off"
                  disabled={disabled || loading}
                  onFocus={() => {
                    if (!disabled && !loading) {
                      setShowAllOptions(true);
                      setIsOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsOpen(false), 200);
                  }}
                />
                {loading ? (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                <Combobox.Button
                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                  onClick={() => {
                    if (!disabled && !loading) {
                      setShowAllOptions(true);
                      setIsOpen(!isOpen);
                    }
                  }}
                >
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>
                )}

              <Transition
                  show={isOpen}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
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
                  <Combobox.Options 
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
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
                            onClick={() => setIsOpen(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePlayerChange(player);
                                setIsOpen(false);
                              }
                            }}
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
              {removeButton && selectedPlayer && (
                <button
                  type="button"
                  onClick={() => handlePlayerChange(null)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md border border-gray-300 shadow-sm transition-colors flex-shrink-0"
                  title="Spieler entfernen"
                >
                  <MinusCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
      </Combobox>
    </div>
  );
});

// Main component that conditionally renders based on Formik context
const RosterPlayerSelect = forwardRef<RosterPlayerSelectHandle, RosterPlayerSelectProps>((props, ref) => {
  const formikContext = useFormikContext();
  const isInFormikContext = !!formikContext;

  if (isInFormikContext) {
    return <FormikRosterPlayerSelect {...props} ref={ref} />;
  } else {
    return <StandaloneRosterPlayerSelect {...props} ref={ref} />;
  }
});

FormikRosterPlayerSelect.displayName = 'FormikRosterPlayerSelect';
StandaloneRosterPlayerSelect.displayName = 'StandaloneRosterPlayerSelect';
RosterPlayerSelect.displayName = 'RosterPlayerSelect';

export default RosterPlayerSelect;