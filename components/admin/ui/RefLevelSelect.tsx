import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { classNames } from '../../../tools/utils';
import { refereeLevels } from '../../../tools/consts';

type RefereeLevel = keyof typeof refereeLevels

interface RefLevelSelectProps {
  selectedLevel: RefereeLevel;
  onLevelChange: (level: RefereeLevel) => void;
  allLevels?: RefereeLevel[];
  label?: string
}

const RefLevelSelect: React.FC<RefLevelSelectProps> = ({
  selectedLevel,
  onLevelChange,
  allLevels = Object.keys(refereeLevels).filter(key => key !== 'n/a') as RefereeLevel[],
  label = 'Level'
}) => {
  return (
    <Listbox value={selectedLevel} onChange={onLevelChange}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">{label}</Listbox.Label>
          )}
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <div className="flex items-center">
                {selectedLevel && selectedLevel !== 'n/a' ? (
                  <>
                    {refereeLevels[selectedLevel] && (
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-3 ${refereeLevels[selectedLevel].background} ${refereeLevels[selectedLevel].text} ${refereeLevels[selectedLevel].ring}`}>
                        {selectedLevel}
                      </span>
                    )}
                    <span className="block truncate">{refereeLevels[selectedLevel].caption}</span>
                  </>
                ) : (
                  <span className="block truncate text-gray-400">(auswählen)</span>
                )}
              </div>
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
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {allLevels.map((level, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={level}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">

                          {refereeLevels[level] && (
                            <div className="w-10 flex flex-col items-center">
                              <span
                                className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", refereeLevels[level].background, refereeLevels[level].text, refereeLevels[level].ring)}
                              >
                                {level}
                              </span>
                            </div>
                          )}
                          <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                            {refereeLevels[level].caption}
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
        </>
      )
      }
    </Listbox >
  )
};

export default RefLevelSelect;
