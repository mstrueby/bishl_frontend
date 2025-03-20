
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { TeamValues } from '../../types/ClubValues';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

interface TeamFullNameSelectProps {
  selectedTeamId?: string | null;
  teams: TeamValues[];
  onTeamChange: (teamId: string) => void;
  label?: string;
}

const TeamFullNameSelect: React.FC<TeamFullNameSelectProps> = ({ 
  selectedTeamId,
  teams,
  onTeamChange,
  label = "Team"
}) => {
  const selectedTeam = teams.find(team => team._id === selectedTeamId);

  return (
    <Listbox value={selectedTeamId} onChange={onTeamChange}>
      <div className="relative mt-2">
        {label && (
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            {label}
          </Listbox.Label>
        )}
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
          {selectedTeam ? (
            <span className="flex items-center gap-x-3">
              {selectedTeam.logoUrl && (
                <Image
                  src={selectedTeam.logoUrl}
                  alt={selectedTeam.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 flex-shrink-0 rounded-full"
                />
              )}
              <span className="block truncate">{selectedTeam.fullName}</span>
            </span>
          ) : (
            <span className="block truncate text-gray-500">Team auswählen</span>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {teams.map((team) => (
              <Listbox.Option
                key={team._id}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                  }`
                }
                value={team._id}
              >
                {({ selected, active }) => (
                  <span className="flex items-center gap-x-3">
                    {team.logoUrl && (
                      <Image
                        src={team.logoUrl}
                        alt={team.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 flex-shrink-0 rounded-full"
                      />
                    )}
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {team.fullName}
                    </span>
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default TeamFullNameSelect;
