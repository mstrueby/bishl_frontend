
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Team } from '../../types/MatchValues';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { CldImage } from 'next-cloudinary';
import { classNames } from '../../tools/utils';

interface TeamFullNameSelectProps {
  selectedTeamId?: string | null;
  teams: Team[];
  onTeamChange: (teamId: string) => void;
  label?: string;
  showReset?: boolean;
}

const TeamFullNameSelect: React.FC<TeamFullNameSelectProps> = ({
  selectedTeamId,
  teams,
  onTeamChange,
  label = null,
  showReset = true
}) => {
  const selectedTeam = teams.find(team => team.fullName === selectedTeamId);

  return (
    <Listbox value={selectedTeamId} onChange={onTeamChange}>
      <div className="relative mt-2">
        {label && (
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            {label}
          </Listbox.Label>
        )}
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
          <span className="flex items-center">
            {selectedTeam ? (
              <>
                <CldImage
                  src={selectedTeam.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                  alt={selectedTeam.tinyName || ''}
                  width={20}
                  height={20}
                  crop="fill_pad"
                  className=""
                />
                <span className="ml-3 block truncate">{selectedTeam.fullName}</span>
              </>
            ) : (
              <span className="ml-3 block truncate text-gray-500">Team auswählen</span>
            )}
          </span>
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
            {showReset && (
              <Listbox.Option
                value=""
                className={({ active }) =>
                  classNames(
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                    'relative cursor-default select-none py-2 pl-3 pr-9'
                  )
                }
              >
                {({ selected, active }) => (
                  <>
                    <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                      Alle Teams
                    </span>
                    {selected && (
                      <span
                        className={classNames(
                          active ? 'text-white' : 'text-indigo-600',
                          'absolute inset-y-0 right-0 flex items-center pr-4'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            )}
            {teams.map((team) => (
              <Listbox.Option
                key={team.fullName}
                className={({ active }) =>
                  classNames(
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                    'relative cursor-default select-none py-2 pl-3 pr-9'
                  )
                }
                value={team.fullName}
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex items-center">
                      <CldImage
                        src={team.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                        alt={team.tinyName || ''}
                        width={20}
                        height={20}
                        crop="fill_pad"
                        className=""
                      />
                      <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                        {team.fullName}
                      </span>
                    </div>
                    {selected && (
                      <span
                        className={classNames(
                          active ? 'text-white' : 'text-indigo-600',
                          'absolute inset-y-0 right-0 flex items-center pr-4'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
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
