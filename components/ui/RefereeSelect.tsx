import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserValues } from '../../types/UserValues';
import { Referee } from '../../types/MatchValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { AssignmentValues } from '../../types/AssignmentValues';
import { AssignmentSelect } from '../../types/AssignmentSelect';

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
          <div className="relative mt-2 mb-4 flex gap-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {selected ? (
                  <span className="ml-3 block truncate">{selected.referee.firstName} {selected.referee.lastName}</span>
                ) : (
                  <Placeholder />
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            {selected && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (selected) {
                      await onConfirm(jwt, selected, position);
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

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {assignments?.map((assignment) => (
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
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span className="flex-shrink-0 h-2 w-2 rounded-full mr-2" 
                                style={{ 
                                  backgroundColor: assignment.status === 'REQUESTED' 
                                    ? '#FCD34D' 
                                    : assignment.status === 'UNAVAILABLE'
                                    ? '#EF4444'  
                                    : '#D1D5DB'
                                }} 
                          />
                          <span
                            className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}
                          >
                            {assignment.referee.firstName} {assignment.referee.lastName}
                          </span>
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
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};
export default RefereeSelect;