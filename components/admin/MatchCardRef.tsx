import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { allRefereeAssignmentStatuses, getValidTransitions } from '../../tools/consts';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';

let BASE_URL = process.env.API_URL;

const MatchCardRef: React.FC<{ match: Match, assignment?: AssignmentValues, jwt: string }> = ({ match, assignment, jwt }) => {
  const { home, away, startDate, venue } = match;



  const [selected, setSelected] = useState(
    assignment ?
      allRefereeAssignmentStatuses.find(s => s.key === assignment.status) || allRefereeAssignmentStatuses[0] :
      allRefereeAssignmentStatuses[0]
  )

  const [localAssignment, setLocalAssignment] = useState(assignment);

  // Update local state when the prop changes
  useEffect(() => {
    setLocalAssignment(assignment);
  }, [assignment]);

  const updateAssignmentStatus = async (newStatus: typeof selected) => {
    try {
      const isNewAssignment = !localAssignment || selected.key === 'AVAILABLE';
      const method = isNewAssignment ? 'POST' : 'PATCH';
      const endpoint = isNewAssignment ?
        `${BASE_URL}/assignments/` :
        `${BASE_URL}/assignments/${localAssignment?._id}`;

      const body = isNewAssignment ?
        { matchId: match._id, status: newStatus.key } :
        { status: newStatus.key };

      console.log('Current assignment:', localAssignment);
      console.log('Selected status:', selected.key);
      console.log('Request body:', body);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to update assignment status');
      }

      // For new assignments, save the created assignment data so we can use it
      if (isNewAssignment) {
        const createdAssignment = await response.json();
        console.log('Created new assignment:', createdAssignment);
        
        // Update local assignment state with the newly created assignment
        // This allows further updates without refresh
        if (createdAssignment) {
          setLocalAssignment(createdAssignment);
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      setSelected(selected); // Revert on error
    }
  }

  const handleStatusChange = (newStatus: typeof selected) => {
    setSelected(newStatus);
    updateAssignmentStatus(newStatus);
  }

  const validStatuses = useMemo(() => {
    const validKeys = getValidTransitions(selected.key);
    return allRefereeAssignmentStatuses.filter(status =>
      validKeys.includes(status.key)
    );
  }, [selected.key]);

  const WorkflowListbox: React.FC<{ selected: any, handleStatusChange: (value: any) => void, validStatuses: any[] }> = ({ selected, handleStatusChange, validStatuses }) => (
    <Listbox value={selected} onChange={handleStatusChange}>
      <Label className="sr-only">Change workflow status</Label>
      <div className="relative">
        <div className={classNames("inline-flex rounded-md outline-none", selected.color.divide)}>
          <div className={classNames("inline-flex items-center gap-x-1.5 ", validStatuses.length > 0 ? "rounded-l-md" : "rounded-md", "ring-1 ring-inset py-0.5 px-2", selected.color.background, selected.color.text, selected.color.ring)}>
            <svg viewBox="0 0 6 6" aria-hidden="true" className={classNames("size-1.5", selected.color.dotMyRef)}>
              <circle r={3} cx={3} cy={3} />
            </svg>

            <p className="text-xs font-medium uppercase">{selected.title}</p>
          </div>
          {validStatuses.length > 0 && (
            <ListboxButton className={classNames("inline-flex items-center rounded-l-none rounded-r-md p-0.5 outline-none focus-visible:outline focus-visible:outline-2 ring-1 ring-inset", selected.color.background, selected.color.hover, selected.color.ring, selected.color.focus)}>
              <span className="sr-only">Change workflow status</span>
              <ChevronDownIcon aria-hidden="true" className={classNames("size-4 forced-colors:text-[Highlight]", selected.color.text)} />
            </ListboxButton>
          )}
        </div>

        <ListboxOptions
          transition
          className="absolute right-0 z-10 mt-2 w-auto p-3 grid gap-y-4 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in"
        >
          {validStatuses.map((option) => (
            <ListboxOption
              key={option.title}
              value={option}
              className="group cursor-default select-none text-sm text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
            >
              <div className="flex flex-col">
                <div className="flex justify-between">
                  <div className={classNames("inline-flex rounded-md outline-none", option.color.divide)}>
                    <div className={classNames("inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset py-0.5 px-2", option.color.background, option.color.text, option.color.ring)}>
                      <p className="text-xs font-medium uppercase whitespace-nowrap">{option.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );


  return (
    <div className="flex flex-col sm:flex-row gap-y-2 p-4 my-10 border-2 rounded-xl shadow-md">
      {/* 1 tournament, workflow drop-down (mobile), date, venue */}
      <div className="flex flex-col sm:w-1/3">
        {/* 1-1 tournament, workflow drop-down (mobile) */}
        <div className="flex flex-row justify-between">
          {/* tournament */}
          <div className="">
            {tournamentConfigs.map(item =>
              item.name === match.tournament.name && (
                <span
                  key={item.tiny_name}
                  className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset w-full", item.bdg_col_light)}
                >
                  {item.tiny_name} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                </span>
              )
            )}
          </div>
          {/* workflow dropdown */}
          <div className="sm:hidden">
            <WorkflowListbox selected={selected} handleStatusChange={handleStatusChange} validStatuses={validStatuses} />
          </div>
        </div>
        {/* 1-2 date, venue */}
        <div className="flex flex-row sm:flex-col justify-between sm:justify-end mt-3 sm:mt-0 sm:pr-4 sm:gap-y-2 sm:h-full">
          {/* date */}
          <div className="flex items-center truncate">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" /> {/* Icon for Date */}
            <p className="block md:hidden text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={startDate ? (new Date(startDate)).toISOString() : undefined}>
                {startDate ? (new Date(startDate)).toLocaleString('de-DE', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: undefined,
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'offen'}
              </time>
            </p>
            <p className="hidden md:block text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={startDate ? (new Date(startDate)).toISOString() : undefined}>
                {startDate ? (new Date(startDate)).toLocaleString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'offen'}
              </time>
            </p>
          </div>
          {/* venue */}
          <div className="flex items-center truncate">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
            <p className="text-xs uppercase font-light text-gray-700 truncate">{venue.name}</p>
          </div>
        </div>
      </div>
      {/* 2  matchup */}
      <div className="flex flex-col gap-y-2 sm:gap-x-2 justify-between mt-3 sm:mt-0 w-full sm:w-1/3">
        {/* home */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={home.logo ? home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={home.tinyName} objectFit="contain" height={32} width={32} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium text-gray-600`}>{home.shortName}</p>
          </div>
        </div>
        {/* away */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={away.logo ? away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={away.tinyName} objectFit="contain" height={32} width={32} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium text-gray-600`}>{away.shortName}</p>
          </div>
        </div>
      </div>
      {/* 3 assigned Referees, workflow drop-down (tablet) */}
      <div className="flex flex-col justify-between mt-1.5 sm:mt-0 pt-2 sm:pt-0 sm:pb-1 sm:w-1/3 border-t sm:border-t-0 sm:border-l sm:pl-3">
        <div className="sm:flex hidden flex-row justify-end">
          <WorkflowListbox selected={selected} handleStatusChange={handleStatusChange} validStatuses={validStatuses} />
        </div>
        <div className="flex flex-col sm:flex-none justify-center">
          {/* assigned Referees */}
          <div className="flex flex-row items-center justify-between">
            {match.referee1 && (
              <div className="flex items-center gap-x-2">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {match.referee1.firstName.charAt(0)}{match.referee1.lastName.charAt(0)}
                </div>
                <span className="text-sm text-gray-600 truncate">
                  {match.referee1.firstName} {match.referee1.lastName}
                </span>
              </div>
            )}
            {match.referee2 && (
              <div className="flex items-center gap-x-2">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {match.referee2.firstName.charAt(0)}{match.referee2.lastName.charAt(0)}
                </div>
                <span className="text-sm text-gray-600 truncate">
                  {match.referee2.firstName} {match.referee2.lastName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
};

export default MatchCardRef;