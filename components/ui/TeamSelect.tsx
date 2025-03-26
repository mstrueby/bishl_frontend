import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { TeamValues } from '../../types/ClubValues';
import { PlayerValues } from '../../types/PlayerValues';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { canAlsoPlayInAgeGroup, ageGroupConfig } from '../../tools/consts';
import { classNames } from '../../tools/utils';


interface TeamSelectProps {
  selectedTeamId?: string | null;
  teams: TeamValues[];
  onTeamChange: (teamId: string) => void;
  label?: string;
  player?: PlayerValues | null;
}

const TeamSelect: React.FC<TeamSelectProps> = ({
  selectedTeamId,
  teams,
  onTeamChange,
  label = "Mannschaft",
  player = null
}) => {
  const selectedTeam = teams.find(team => team._id === selectedTeamId);

  const getAgeGroupColor = (team: TeamValues) => {
    if (!player?.ageGroup || !team.ageGroup) return 'gray';
    return player.ageGroup === team.ageGroup ? 'green' :
      canAlsoPlayInAgeGroup(player.ageGroup, team.ageGroup, player.overAge || false) ? 'yellow' : 'red';
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-400/20`,
    dot: `bg-${color}-500`
  });

  const sortedTeams = teams.sort((a, b) => {
    const aGroup = ageGroupConfig.find(ag => ag.key === a.ageGroup);
    const bGroup = ageGroupConfig.find(ag => ag.key === b.ageGroup);
    const sortOrderDiff = (aGroup?.sortOrder || 0) - (bGroup?.sortOrder || 0);
    return sortOrderDiff !== 0 ? sortOrderDiff : (a.teamNumber || 0) - (b.teamNumber || 0);
  });

  return (
    <Listbox value={selectedTeamId} onChange={onTeamChange}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
              {label}
            </Listbox.Label>
          )}
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              {selectedTeam ? (
                <span className="flex items-center gap-x-3">
                  {player && (
                    <span className={`flex-none rounded-full p-1 ${getColorClasses(getAgeGroupColor(selectedTeam)).bg}`}>
                      <div className={`h-2 w-2 rounded-full ${getColorClasses(getAgeGroupColor(selectedTeam)).dot}`} />
                    </span>
                  )}
                  <span className="block truncate">{selectedTeam.name}</span>
                </span>
              ) : (
                <span className="block truncate text-gray-400">(auswählen)</span>
              )}
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
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
                {sortedTeams.map((team) => {
                  const color = getAgeGroupColor(team);
                  const colorClasses = getColorClasses(color);

                  return (
                    <Listbox.Option
                      key={team._id}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={team._id}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center gap-x-3">
                            {player && (
                              <span className={`flex-none rounded-full p-1 ${colorClasses.bg}`}>
                                <div className={`h-2 w-2 rounded-full ${colorClasses.dot}`} />
                              </span>
                            )}
                            <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                              {team.name}
                            </span>
                          </div>
                          {selected && (
                            <span className={classNames(
                              active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />

                            </span>

                          )
                          }
                        </>
                      )}
                    </Listbox.Option>
                  );
                })}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox >
  );
};

export default TeamSelect;