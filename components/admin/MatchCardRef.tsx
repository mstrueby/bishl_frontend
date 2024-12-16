import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CalendarIcon, MapPinIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const MatchCardRef: React.FC<{ match: Match, assignment?: AssignmentValues, jwt: string }> = ({ match, assignment, jwt }) => {
  const { home, away, startDate, venue } = match;

  const allStatuses = [
    {
      key: 'AVAILABLE', title: 'Verfügbar', current: true, color: {
        divide: 'divide-gray-500/10',
        background: 'bg-gray-50',
        text: 'text-gray-600',
        ring: 'ring-gray-500/10',
        hover: 'hover:bg-gray-100',
        focus: 'focus-visible:outline-gray-500/10',
        dot: 'fill-gray-400'
      }
    },
    {
      key: 'REQUESTED', title: 'Angefragt', current: false, color: {
        divide: 'divide-yellow-600/20',
        background: 'bg-yellow-50',
        text: 'text-yellow-800',
        ring: 'ring-yellow-600/20',
        hover: 'hover:bg-yellow-100',
        focus: 'focus-visible:outline-yellow-600/20',
        dot: 'fill-yellow-500'
      }
    },
    {
      key: 'UNAVAILABLE', title: 'Nicht verfügbar', current: false, color: {
        divide: 'divide-red-600/10',
        background: 'bg-red-50',
        text: 'text-red-700',
        ring: 'ring-red-600/10',
        hover: 'hover:bg-red-100',
        focus: 'focus-visible:outline-red-600/10',
        dot: 'fill-red-500'
      }
    },
    {
      key: 'ASSIGNED', title: 'Eingeteilt', current: false, color: {
        divide: 'divide-green-600/20',
        background: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        hover: 'hover:bg-green-100',
        focus: 'focus-visible:outline-green-600/20',
        dot: 'fill-green-500'
      }
    },
    {
      key: 'ACCEPTED', title: 'Bestätigt', current: false, color: {
        divide: 'divide-green-100',
        background: 'bg-green-100',
        text: 'text-green-700',
        ring: 'ring-green-100',
        hover: 'hover:bg-green-100',
        focus: 'focus-visible:outline-green-100',
        dot: 'fill-green-600'
      }
    },
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
        return ['REQUESTED'];
      default:
        return ['AVAILABLE'];
    }
  }

  const [selected, setSelected] = useState(
    assignment ?
      allStatuses.find(s => s.key === assignment.status) || allStatuses[0] :
      allStatuses[0]
  )

  const updateAssignmentStatus = async (newStatus: typeof selected) => {
    try {
      const method = (!assignment || selected.key === 'AVAILABLE') ? 'POST' : 'PATCH';
      const endpoint = (!assignment || selected.key === 'AVAILABLE') ?
        `${process.env.NEXT_PUBLIC_API_URL}/assignments` :
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment._id}`;

      const body = (!assignment || selected.key === 'AVAILABLE') ?
        { matchId: match._id, status: newStatus.key } :
        { status: newStatus.key };

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
    return allStatuses.filter(status =>
      validKeys.includes(status.key)
    );
  }, [selected.key]);

  const WorkflowListbox: React.FC<{ selected: any, handleStatusChange: (value: any) => void, validStatuses: any[] }> = ({ selected, handleStatusChange, validStatuses }) => (
    <Listbox value={selected} onChange={handleStatusChange}>
      <Label className="sr-only">Change workflow status</Label>
      <div className="relative">
        <div className={classNames("inline-flex rounded-md outline-none", selected.color.divide)}>
          <div className={classNames("inline-flex items-center gap-x-1.5 rounded-l-md ring-1 ring-inset py-0.5 px-2", selected.color.background, selected.color.text, selected.color.ring)}>
            <svg viewBox="0 0 6 6" aria-hidden="true" className={classNames("size-1.5", selected.color.dot)}>
              <circle r={3} cx={3} cy={3} />
            </svg>
            <p className="text-xs font-medium uppercase">{selected.title}</p>
          </div>
          <ListboxButton className={classNames("inline-flex items-center rounded-l-none rounded-r-md p-0.5 outline-none focus-visible:outline focus-visible:outline-2 ring-1 ring-inset", selected.color.background, selected.color.hover, selected.color.ring, selected.color.focus)}>
            <span className="sr-only">Change workflow status</span>
            <ChevronDownIcon aria-hidden="true" className={classNames("size-4 forced-colors:text-[Highlight]", selected.color.text)} />
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
  );


  return (
    <div className="flex flex-col sm:flex-row gap-y-2 p-4 my-10 border-2 rounded-xl shadow-md">
      {/* 1 tournament, status (mobile), date, venue */}
      <div className="flex flex-col sm:w-1/3">
        {/* 1-1 tournament, status (mobile) */}
        <div className="flex flex-row justify-between">
          {/* tournament */}
          <div className="flex items-center gap-2">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900 hover:text-gray-500">
                <FunnelIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Show filters</span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                        )}>
                          Alle Spiele
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                        )}>
                          Verfügbar
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button className={classNames(
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                        )}>
                          Angefragt
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
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
          <WorkflowListbox selected={selected} handleStatusChange={handleStatusChange} validStatuses={validStatuses} />
        </div>
        <div className="flex flex-col sm:flex-none justify-center sm:items-end">

        </div>
      </div>
    </div>
  )
};

export default MatchCardRef;