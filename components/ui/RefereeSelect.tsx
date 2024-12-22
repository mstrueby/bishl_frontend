import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserValues } from '../../types/UserValues';
import { Referee } from '../../types/MatchValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { AssignmentValues } from '../../types/AssignmentValues';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface RefereeSelectProps {
  selectedReferee: Referee | null;
  onRefereeChange: (referee: Referee) => void;
  assignments: AssignmentValues[];
  matchId: string;
  position: number;
  jwt: string;
  onConfirm: (jwt: string) => void;
  onCancel: () => void;
  temporarySelection: Referee | null;
}
const RefereeSelect: React.FC<RefereeSelectProps> = ({ 
  selectedReferee: propSelectedReferee,
  onRefereeChange,
  assignments,
  matchId,
  position,
  jwt,
  temporarySelection,
  onConfirm,
  onCancel
}) => {
  const [selectedReferee, setselectedReferee] = useState<Referee | null>(propSelectedReferee);
  const [displayedReferee, setDisplayedReferee] = useState<Referee | null>(propSelectedReferee);

  useEffect(() => {
    setselectedReferee(propSelectedReferee);
    setDisplayedReferee(propSelectedReferee);
  }, [propSelectedReferee]);

  useEffect(() => {
    if (!temporarySelection) {
      setDisplayedReferee(null);
    }
  }, [temporarySelection]);

  // Placeholder component for the listbox
  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Listbox value={assignments.find(a => a.referee === displayedReferee) || null} 
      onChange={(assignment: AssignmentValues | null) => {
        if (assignment) {
          const assignmentSelect: AssignmentSelect = {
            matchId: matchId,
            userId: assignment.referee.userId,
            status: assignment.status,
            refAdmin: true,
            position: position
          };
          setDisplayedReferee(assignment.referee);
          onRefereeChange(assignment.referee);
        }
    }}>
      {({ open }) => (
        <>
         {/*<Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">Wettbewerb:</Listbox.Label>*/}
          <div className="relative mt-2 mb-4 flex gap-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {displayedReferee ? (
                  <span className="ml-3 block truncate">{displayedReferee.firstName} {displayedReferee.lastName}</span>
                ) : (
                  <Placeholder />
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            {temporarySelection && (
              <div className="flex gap-2">
                <button
                  onClick={() => onConfirm(jwt)}
                  className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <CheckIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                </button>
                <button
                  onClick={onCancel}
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