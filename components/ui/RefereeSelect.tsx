
import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserValues } from '../../types/UserValues';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { AssignmentValues } from '../../types/AssignmentValues';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface RefereeSelectProps {
  selectedReferee: UserValues | null;
  onRefereeChange: (referee: UserValues) => void;
  allRefereesData: UserValues[];
  matchId: string;
  assignments: { [key: string]: AssignmentValues };
}

const RefereeSelect: React.FC<RefereeSelectProps> = ({ 
  selectedReferee: propSelectedReferee,
  onRefereeChange, 
  allRefereesData,
  matchId,
  assignments
}) => {
  const [selectedReferee, setselectedReferee] = useState<UserValues | null>(propSelectedReferee);

  useEffect(() => {
    setselectedReferee(propSelectedReferee);
  }, [propSelectedReferee]);

  const getAssignmentStatus = (refereeId: string) => {
    const assignmentKey = `${matchId}-${refereeId}`;
    return assignments[assignmentKey]?.status || null;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'REQUESTED':
        return '#FCD34D';
      case 'ASSIGNED':
        return '#34D399';
      case 'ACCEPTED':
        return '#10B981';
      case 'UNAVAILABLE':
        return '#EF4444';
      default:
        return '#D1D5DB';
    }
  };

  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Listbox value={selectedReferee} onChange={(referee) => {
      setselectedReferee(referee);
      if (referee) {
        onRefereeChange(referee);
      }
    }}>
      {({ open }) => (
        <>
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {selectedReferee ? (
                  <span className="ml-3 block truncate">{selectedReferee.firstName} {selectedReferee.lastName}</span>
                ) : (
                  <Placeholder />
                )}
              </span>
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
                {allRefereesData?.map((referee) => {
                  const status = getAssignmentStatus(referee._id);
                  return (
                    <Listbox.Option
                      key={referee._id}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={referee}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            <span 
                              className="flex-shrink-0 h-2 w-2 rounded-full mr-2" 
                              style={{ backgroundColor: getStatusColor(status) }}
                            />
                            <span
                              className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}
                            >
                              {referee.firstName} {referee.lastName}
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
                  );
                })}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default RefereeSelect;
