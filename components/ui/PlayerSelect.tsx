
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
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({
  selectedPlayer: propSelectedPlayer,
  onChange,
  roster,
  label,
  required = false,
  placeholder = "Spieler auswählen",
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(propSelectedPlayer);

  // When the 'propSelectedPlayer' changes, update the local state
  useEffect(() => {
    setSelectedPlayer(propSelectedPlayer);
  }, [propSelectedPlayer]);

  const handlePlayerChange = (player: RosterPlayer | null) => {
    setSelectedPlayer(player);
    onChange(player);
  };

  const Placeholder = () => (
    <span className="block truncate text-gray-400">{placeholder}</span>
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
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
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
                {roster?.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                    Niemand verfügbar
                  </div>
                ) : (
                  roster?.map((player) => (
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
