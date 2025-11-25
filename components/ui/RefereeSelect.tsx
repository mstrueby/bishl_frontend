import React, { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserValues } from '../../types/UserValues';
import { Referee } from '../../types/MatchValues';
import { allRefereeAssignmentStatuses, refereeLevels } from '../../tools/consts';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { AssignmentValues } from '../../types/AssignmentValues';
import { CldImage } from 'next-cloudinary';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type RefereeSelectProps = {
  assignments: AssignmentValues[];
  position: number;
  onConfirm: (assignmentId: string, status: string, position: number) => void;
  assignmentId?: string;
  initialStatus?: string;
};

{/** Referee Item */ }
const RefereeItem: React.FC<{ assignment: AssignmentValues, showDetails?: boolean }> = ({ assignment, showDetails = true }) => (
  <div className="flex items-center gap-x-3">
    <div className="flex items-center gap-x-3 flex-1 truncate">
      {/** status indicator */}
      <svg
        className={classNames(
          "flex-shrink-0 h-2 w-2",
          allRefereeAssignmentStatuses.find(status => status.key === assignment.status)?.color.dotRefAdmin ?? 'fill-black'
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
        {assignment.referee.firstName}{showDetails ? ` ${assignment.referee.lastName}` : ''}
      </span>
    </div>
    {showDetails && (
      <>
        {/** Club Logo */}
        {assignment.referee.logoUrl && (
          <CldImage
            src={assignment.referee.logoUrl}
            alt={assignment.referee.clubName}
            className="h-6 w-6"
            width={20}
            height={20}
            crop="fill_pad"
          />
        )}

        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ml-auto
          ${refereeLevels[assignment.referee.level as keyof typeof refereeLevels]?.background || refereeLevels['n/a'].background}
          ${refereeLevels[assignment.referee.level as keyof typeof refereeLevels]?.text || refereeLevels['n/a'].text}
          ${refereeLevels[assignment.referee.level as keyof typeof refereeLevels]?.ring || refereeLevels['n/a'].ring}`}>
          {assignment.referee.level}
        </span>
      </>
    )}
  </div>
);


const RefereeSelect: React.FC<RefereeSelectProps> = ({
  assignments,
  position,
  onConfirm,
  assignmentId,
  initialStatus
}) => {
  //disabled = false;
  const [selected, setSelected] = useState<AssignmentValues | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Placeholder component for the listbox
  const Placeholder = () => (
    <span className={`block truncate ${disabled ? 'text-red-700' : 'text-gray-400'}`}>{disabled ? "(gesperrt)" : "(auswählen)"}</span>
  );

  return (
    <>
      <Listbox
        value={selected}
        onChange={setSelected}
        disabled={disabled}
      >
        {({ open }) => (
          <div className="relative">
            <div className="relative w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                  {selected ? (
                    <RefereeItem assignment={selected} showDetails={false} />
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
                        setConfirmLoading(true);
                        const assignedRef = { ...selected, status: 'ASSIGNED' };
                        await onConfirm(selected.assignmentId, 'ASSIGNED', position);
                        onAssignmentComplete(selected.referee);
                        setConfirmLoading(false);
                      }
                    }}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    disabled={confirmLoading}
                  >
                    {confirmLoading ? (
                      <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    ) : (
                      <CheckIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                    )}
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
                          'relative cursor-default select-none py-2 px-3'
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
        )}
      </Listbox>
    </>
  );
};
export default RefereeSelect;