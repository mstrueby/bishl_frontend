import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';

const MatchCardRef: React.FC<{ match: Match, assignment: AssignmentValues }> = ({ match, assignment }) => {
  const { home, away, startDate, venue } = match;

  const allStatuses = [
    { key: 'AVAILABLE', title: 'Verfügbar', current: true },
    { key: 'REQUESTED', title: 'Angefragt', current: false },
    { key: 'UNAVAILABLE', title: 'Nicht verfügbar', current: false },
    { key: 'ASSIGNED', title: 'Eingeteilt', current: false },
    { key: 'ACCEPTED', title: 'Bestätigt', current: false },
  ]

  const getValidTransitions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'AVAILABLE':
        return ['REQUESTED', 'UNAVAILABLE'];
      case 'REQUESTED':
        return ['UNAVAILABLE'];
      case 'ASSIGNED':
        return ['ACCEPTED'];
      case 'ACCEPTED':
        return [];
      case 'UNAVAILABLE':
        return ['AVAILABLE', 'REQUESTED'];
      default:
        return ['AVAILABLE'];
    }
  }

  const [selected, setSelected] = useState(
    assignment ? 
    allStatuses.find(s => s.key === assignment.status) || allStatuses[0] : 
    allStatuses[0]
  )

  const validStatuses = useMemo(() => {
    const validKeys = getValidTransitions(selected.key);
    return allStatuses.filter(status => 
      validKeys.includes(status.key)
    );
  }, [selected.key]);

  return (
    <div className="flex flex-col sm:flex-row gap-y-2 p-4 my-10 border-2 rounded-xl shadow-md">
      {/* 1 tournament, status (mobile), date, venue */}
      <div className="flex flex-col sm:w-1/3">
        {/* 1-1 tournament, status (mobile) */}
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
          {/* status */}
          <div className="sm:hidden">
            <Listbox value={selected} onChange={setSelected}>
              <Label className="sr-only">Change workflow status</Label>
              <div className="relative">
                <div className="inline-flex divide-x divide-indigo-700 rounded-md outline-none">
                  <div className="inline-flex items-center gap-x-1.5 rounded-l-md bg-indigo-600 px-3 py-2 text-white">
                    <p className="text-sm font-semibold">{selected.title}</p>
                  </div>
                  <ListboxButton className="inline-flex items-center rounded-l-none rounded-r-md bg-indigo-600 p-2 outline-none hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400">
                    <span className="sr-only">Change workflow status</span>
                    <ChevronDownIcon aria-hidden="true" className="size-5 text-white forced-colors:text-[Highlight]" />
                  </ListboxButton>
                </div>

                <ListboxOptions
                  transition
                  className="absolute right-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in"
                >
                  {validStatuses.map((option) => (
                    <ListboxOption
                      key={option.title}
                      value={option}
                      className="group cursor-default select-none p-4 text-sm text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <p className="font-normal group-data-[selected]:font-semibold">{option.title}</p>
                          
                        </div>
                      </div>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </div>
        </div>
        {/* 1-2 date, venue */}
        <div className="flex flex-row sm:flex-col justify-between sm:justify-end mt-3 sm:mt-0 sm:pr-4 sm:gap-y-2 sm:h-full">
          {/* date */}
          <div className="flex items-center truncate">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" /> {/* Icon for Date */}
            <p className="block md:hidden text-xs uppercase font-light text-gray-700 my-0"><time dateTime={(new Date(startDate)).toISOString()}>{(new Date(startDate)).toLocaleString('de-DE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: undefined,
              hour: '2-digit',
              minute: '2-digit'
            })}</time></p>
            <p className="hidden md:block text-xs uppercase font-light text-gray-700 my-0"><time dateTime={(new Date(startDate)).toISOString()}>{(new Date(startDate)).toLocaleString('de-DE', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</time></p>
          </div>
          {/* venue */}
          <div className="flex items-center truncate">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
            <p className="text-xs uppercase font-light text-gray-700 truncate">{venue.name}</p>
          </div>
        </div>
      </div>
      {/* 2  scores */}
      <div className="flex flex-col gap-y-2 sm:gap-x-2 justify-between mt-3 sm:mt-0 w-full sm:w-1/2">
        {/* home */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={home.logo ? home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={home.tinyName} objectFit="contain" height={32} width={32} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium text-gray-600`}>{home.fullName}</p>
          </div>
        </div>
        {/* away */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={away.logo ? away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={away.tinyName} objectFit="contain" height={32} width={32} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium text-gray-600`}>{away.fullName}</p>
          </div>
        </div>
      </div>
      {/* 3 button Spielberich, status (tablet) */}
      <div className="flex flex-col justify-between mt-3 sm:mt-0 sm:w-1/4 md:w-1/6">
        <div className="sm:flex hidden flex-row justify-end">
          <p>{assignment ? assignment.status : 'AVAILABLE'}</p>
          {/*<StatusBadge
            statusKey={match.matchStatus.key}
            finishTypeKey={match.finishType.key}
            statusValue={match.matchStatus.value}
            finishTypeValue={match.finishType.value}
          />*/}
        </div>
        <div className="flex flex-col sm:flex-none justify-center sm:items-end">

        </div>
      </div>
    </div>
  )
};

export default MatchCardRef;