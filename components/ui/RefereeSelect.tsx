import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserValues } from '../../types/UserValues';
import { Referee } from '../../types/MatchValues';
import { allRefereeAssignmentStatuses } from '../../tools/consts';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { AssignmentValues } from '../../types/AssignmentValues';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface RefereeSelectProps {
  assignments: AssignmentValues[];
  position: number;
  jwt: string;
  onConfirm: (jwt: string, assignment: AssignmentValues, position: number) => Promise<void>;
  onAssignmentComplete: (referee: Referee) => void;
}


{/** Referee Item */ }
const RefereeItem: React.FC<{ assignment: AssignmentValues, showLastName?: boolean }> = ({ assignment, showLastName = true }) => (
  <div className="flex items-center gap-x-3">
    {/** status indicator */}
    <svg
      className={classNames(
        "flex-shrink-0 h-2 w-2",
        allRefereeAssignmentStatuses.find(status => status.key === assignment.status)?.color.dot ?? 'fill-black'
      )}
      viewBox="0 0 8 8"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
    {/** Profile Avatar */}
    <div className="size-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">
      {assignment.referee.firstName.charAt(0)}{assignment.referee.lastName.charAt(0)}
    </div>
    {/** Name */}
    <span className="font-normal block truncate">
      {assignment.referee.firstName}{showLastName ? ` ${assignment.referee.lastName}` : ''}
    </span>
  </div>
);


const RefereeSelect: React.FC<RefereeSelectProps> = ({
  assignments,
  position,
  jwt,
  onConfirm,
  onAssignmentComplete
}) => {
  const [selected, setSelected] = useState<AssignmentValues | null>(null);

  // Placeholder component for the listbox
  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Listbox value={selected}
      onChange={setSelected}
    >
      {({ open }) => (
        <>
          {/*<Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">Wettbewerb:</Listbox.Label>*/}
          <div className="relative">
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                  {selected ? (
                    <RefereeItem assignment={selected} showLastName={false} />
                  ) : (
                    <Placeholder />
                  )}
                  <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
              </div>

              {selected && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (selected) {
                        const assignedRef = { ...selected, status: 'ASSIGNED' };
                        await onConfirm(jwt, assignedRef, position);
                        onAssignmentComplete(selected.referee);
                      }
                    }}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <CheckIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {assignments?.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                    Niemand verfügbar
                  </div>
                ) : (
                  assignments?.map((assignment) => (
                    <Listbox.Option
                      key={assignment.referee.userId}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={assignment}
                    >
                      <RefereeItem assignment={assignment} />
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
export default RefereeSelect;