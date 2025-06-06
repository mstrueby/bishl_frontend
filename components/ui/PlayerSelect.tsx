import React, { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from '@headlessui/react';
import { RosterPlayer } from '../../types/MatchValues';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

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

const PlayerSelect = React.forwardRef<HTMLInputElement, PlayerSelectProps>(({
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
  error = false,
  tabIndex,
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
    return `${player.player.jerseyNumber} - ${player.player.lastName}, ${player.player.firstName}`;
  };

  return (
    <Combobox
      as="div"
      value={selectedPlayer}
      onChange={handlePlayerChange}
    >
      {label && (
        <Label className="block text-sm font-medium leading-6 text-gray-900">
          {label}
        </Label>
      )}
      <div className="relative mt-2">
        <ComboboxInput
          ref={(el) => {
            inputRef.current = el;
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref) {
              ref.current = el;
            }
          }}
          tabIndex={tabIndex}
          className={`block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 ${error ? 'outline-red-300 focus:outline-red-500' : 'outline-gray-300 focus:outline-indigo-600'} placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm`}
          onChange={(event) => {setQuery(event.target.value); handleQueryChange(event)}}
          onBlur={() => setQuery('')}
          displayValue={displayValue}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
          <ChevronUpDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        {filteredRoster.length > 0 && (
          <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm">
            {filteredRoster.map((player) => (
              <ComboboxOption
                key={player.player.playerId}
                value={player}
                className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
              >
                <div className="flex items-center group-data-selected:font-semibold">
                  <span className="w-6 text-center mr-3">{player.player.jerseyNumber}</span>
                  <span className="truncate">{player.player.lastName}, {player.player.firstName}</span>
                </div>

                <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-focus:text-white group-data-selected:flex">
                  <CheckIcon className="size-5" aria-hidden="true" />
                </span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
});

PlayerSelect.displayName = 'PlayerSelect';

export default PlayerSelect;