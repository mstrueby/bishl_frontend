import { Fragment, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../../tools/utils';

interface MatchStatusSelectProps {
  selectedStatus?: { key: string, value: string } | null;
  statuses: { key: string, value: string }[];
  onStatusChange: (key: string) => void;
  label?: string;
  currentStatus?: string;
  userRole: string[];
}

const transitionsByRole: Record<string, Record<string, string[]>> = {
  LEAGUE_ADMIN: {
    SCHEDULED: ['INPROGRESS', 'CANCELLED', 'FORFEITED'],
    INPROGRESS: ['FINISHED'],
  },
  CLUB_ADMIN: {
    SCHEDULED: ['INPROGRESS'],
    INPROGRESS: ['FINISHED'],
  },
};

const MatchStatusSelect: React.FC<MatchStatusSelectProps> = ({
  selectedStatus,
  statuses = [],
  onStatusChange,
  label = "Status",
  currentStatus,
  userRole,
}) => {

  console.log("CurrentStatus: ", currentStatus)
  console.log("UserRole: ", userRole)
  console.log("Statuses: ", statuses)
  
  const allowedStatuses = useMemo(() => {
    console.log("UserRoles: ", userRole)
    if (!userRole || !Array.isArray(userRole)) return [];
    
    // Admin has full access
    if (userRole.includes('ADMIN')) return statuses;
    
    // Check if any role has defined transitions
    const allAllowedKeys = new Set<string>();
    userRole.forEach(role => {
      const roleTransitions = transitionsByRole[role];
      if (roleTransitions && currentStatus) {
        const allowed = roleTransitions[currentStatus];
        if (allowed) {
          allowed.forEach(key => allAllowedKeys.add(key));
        }
      }
    });

    if (allAllowedKeys.size === 0) {
      // If no specific transitions found but roles exist, return current status at least
      return statuses.filter(s => s.key === currentStatus);
    }

    return statuses.filter(
      (s) => s.key === currentStatus || allAllowedKeys.has(s.key)
    );
  }, [statuses, currentStatus, userRole]);

  return (
    <Listbox
      value={allowedStatuses.find(status => status.key === selectedStatus?.key)}
      onChange={(selected) => {
        if (selected) {
          onStatusChange(selected.key);
        }
      }}>
      <div className="relative mt-2">
        {label && (
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            {label}
          </Listbox.Label>
        )}
        <p className="mt-1 text-xs text-amber-600">
          Änderung des Status kann nicht rückgängig gemacht werden.
        </p>
        <div className="relative mt-2">
          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
            <span className="flex items-center">
              {selectedStatus ? (
                <span className="ml-3 block truncate">
                  {selectedStatus.value}
                </span>
              ) : (
                <span className="ml-3 block truncate text-gray-400">Status auswählen</span>
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
            <Listbox.Options className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {allowedStatuses.map((status) => (
                <Listbox.Option
                  key={status.key}
                  value={status}
                  className={({ active, selected }) =>
                    classNames(
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                      selected ? 'bg-indigo-50 font-semibold' : '',
                      'relative cursor-default select-none py-2 px-3'
                    )
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                          {status.value}
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
      </div>
    </Listbox>
  );
};

export default MatchStatusSelect;
