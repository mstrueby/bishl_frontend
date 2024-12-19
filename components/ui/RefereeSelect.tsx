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
  assignments: AssignmentValues[];
  matchId: string;
}
const RefereeSelect: React.FC<RefereeSelectProps> = ({ 
  selectedReferee: propSelectedReferee,
  onRefereeChange, 
  allRefereesData 
}) => {
  const [selectedReferee, setselectedReferee] = useState<TournamentValues | null>(propSelectedReferee);

  // When the 'propSelectedReferee' changes, update the local state
  useEffect(() => {
    setselectedReferee(propSelectedReferee);
  }, [propSelectedReferee]);


  // Placeholder component for the listbox
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
         {/*<Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">Wettbewerb:</Listbox.Label>*/}
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {selectedReferee ? (
                  <span className="ml-3 block truncate">{selectedReferee.firstName}</span>
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
                {allRefereesData?.map((referee) => (
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
                          <span className="flex-shrink-0 h-2 w-2 rounded-full mr-2" 
                                style={{ 
                                  backgroundColor: assignments[`${matchId}-${referee._id}`]?.status === 'REQUESTED' 
                                    ? '#FCD34D' 
                                    : '#D1D5DB'
                                }} 
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