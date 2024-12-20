import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import RefereeSelect from '../ui/RefereeSelect';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';

const MatchCardRefAdmin: React.FC<{ match: Match, assignments: AssignmentValues[], jwt: string }> = ({ match, assignments, jwt }) => {
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

  const [assignmentStatuses, setAssignmentStatuses] = useState<{[key: string]: typeof allStatuses[0]}>({});
  const [selected, setSelected] = useState<typeof allStatuses[0]>(allStatuses[0]);
  const [temporaryReferee1, setTemporaryReferee1] = useState<any>(null);
  const [temporaryReferee2, setTemporaryReferee2] = useState<any>(null);

  useEffect(() => {
    const initialStatuses = {};
    assignments.forEach(assignment => {
      initialStatuses[assignment.referee.userId] = allStatuses.find(s => s.key === assignment.status) || allStatuses[0];
    });
    setAssignmentStatuses(initialStatuses);
  }, [assignments]);

  const updateAssignmentStatus = async (refereeId: string, newStatus: typeof allStatuses[0]) => {
    try {
      const existingAssignment = assignments.find(a => a.referee.userId === refereeId);
      const method = (!existingAssignment || existingAssignment.status === 'AVAILABLE') ? 'POST' : 'PATCH';
      const endpoint = (!existingAssignment || existingAssignment.status === 'AVAILABLE') ?
        `${process.env.NEXT_PUBLIC_API_URL}/assignments` :
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${existingAssignment._id}`;

      const body = (!existingAssignment || existingAssignment.status === 'AVAILABLE') ?
        { matchId: match._id, refereeId: refereeId, status: newStatus.key } :
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
    updateAssignmentStatus(newStatus.key, newStatus); // Pass the refereeId as well
  };

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
        {/* 1-1 tournament, (empty status) */}
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
      {/* 3 Referee Select Panel */}
      <div className="flex flex-col justify-between mt-3 sm:mt-0 sm:w-1/4 md:w-1/6">
        <div className="flex flex-col space-y-2">
          <div className="w-full">
            {match.referee1 ? (
              <div className="py-1.5 px-3 rounded-md bg-gray-50 text-sm text-gray-900">
                {match.referee1.firstName} {match.referee1.lastName}
              </div>
            ) : (
              <RefereeSelect 
                selectedReferee={match.referee1 || null}
                onRefereeChange={(referee) => {
                  if (referee) {
                    setTemporaryReferee1(referee);
                  }
                }}
                assignments={assignments}
                matchId={match._id}
                position={1}
                jwt={jwt}
                onConfirm={() => {
                  if (temporaryReferee1) {
                    updateAssignmentStatus(temporaryReferee1._id, allStatuses.find(s => s.key === 'REQUESTED') || allStatuses[0]);
                    setTemporaryReferee1(null);
                  }
                }}
                onCancel={() => {
                  setTemporaryReferee1(null);
                }}
                temporarySelection={temporaryReferee1}
              />
            )}
          </div>
          <div className="w-full">
            {match.referee2 ? (
              <div className="py-1.5 px-3 rounded-md bg-gray-50 text-sm text-gray-900">
                {match.referee2.firstName} {match.referee2.lastName}
              </div>
            ) : (
              <RefereeSelect 
                selectedReferee={match.referee2 || null}
                onRefereeChange={(referee) => {
                  if (referee) {
                    setTemporaryReferee2(referee);
                  }
                }}
                assignments={assignments}
                matchId={match._id}
                position={2}
                jwt={jwt}
                onConfirm={() => {
                  if (temporaryReferee2) {
                    updateAssignmentStatus(temporaryReferee2._id, allStatuses.find(s => s.key === 'REQUESTED') || allStatuses[0]);
                    setTemporaryReferee2(null);
                  }
                }}
                onCancel={() => {
                  setTemporaryReferee2(null);
                }}
                temporarySelection={temporaryReferee2}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-none justify-center sm:items-end">

        </div>
      </div>
    </div>
  )
};

export default MatchCardRefAdmin;