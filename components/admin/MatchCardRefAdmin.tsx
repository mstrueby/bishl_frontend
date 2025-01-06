import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { Referee } from '../../types/MatchValues';
import { CalendarIcon, MapPinIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import RefereeSelect from '../ui/RefereeSelect';
import { tournamentConfigs, allRefereeAssignmentStatuses } from '../../tools/consts';
import { classNames } from '../../tools/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const MatchCardRefAdmin: React.FC<{ match: Match, assignments: AssignmentValues[], jwt: string }> = ({ match, assignments, jwt }) => {
  const { home, away, startDate, venue } = match;
  const [referee1, setReferee1] = useState<Referee | null>(match.referee1 || null);
  const [referee2, setReferee2] = useState<Referee | null>(match.referee2 || null);
  const [deleteConfirmationMap, setDeleteConfirmationMap] = useState<{ [key: string]: boolean }>({});
  const [unassignLoading, setUnassignLoading] = useState<{ [key: string]: boolean }>({});
  const timeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout }>({});



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

  const updateAssignmentStatus = async (jwt: string, assignment: AssignmentValues, position: number = 1) => {
    try {
      const method = assignment?._id ? 'PATCH' : 'POST';
      const endpoint = `${BASE_URL}/assignments${assignment?._id ? `/${assignment._id}` : ''}`;

      const body = {
        matchId: assignment.matchId,
        userId: assignment.referee.userId,
        status: assignment.status,
        refAdmin: true,
        position: position
      };

      { console.log("enpoint", endpoint) }
      { console.log('Body: ', body) }

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

      // Update the local assignments array with the new status
      const updatedAssignments = assignments.map(a =>
        a.referee.userId === assignment.referee.userId
          ? { ...a, status: assignment.status }
          : a
      );
      assignments.splice(0, assignments.length, ...updatedAssignments);
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  }

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
      {/* 3 Referee Select Panel */}
      <div className="flex flex-col justify-between mt-3 sm:mt-0 pt-2 sm:pt-0 gap-y-2 sm:w-1/3 md:w-1/3 border-t sm:border-0">
        {/* referee 1 (assigned or select box) */}
        <div className="w-full">
          {referee1 ? (
            <div className="px-3 text-sm text-gray-700 flex items-center justify-between">
              {/** status indicator, avatar, name */}
              <div className="flex items-center gap-x-3">
                {(() => {
                  const referee1Assignment = assignments.find(a => a.referee.userId === referee1?.userId);
                  const statusConfig = allRefereeAssignmentStatuses.find(status => status.key === referee1Assignment?.status);
                  console.log('Referee1 Assignment:', referee1Assignment);
                  {/**
                  console.log('Assignment Status:', referee1Assignment?.status);
                  console.log('Status Config:', statusConfig);
                  */}
                  const statusColor = statusConfig?.color.dotRefAdmin || 'fill-gray-400';
                  return (
                    <svg className={`h-2 w-2 ${statusColor}`} viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="4" />
                    </svg>
                  );
                })()}
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {referee1.firstName.charAt(0)}{referee1.lastName.charAt(0)}
                </div>
                <span>
                  {referee1.firstName} {referee1.lastName}
                </span>
              </div>
              {/** unassign button */}
              <button
                onClick={async () => {
                  const assignment = assignments.find(a => a.referee.userId === referee1.userId);
                  if (assignment && deleteConfirmationMap[referee1.userId]) {
                    setUnassignLoading(prev => ({ ...prev, [referee1.userId]: true }));
                    await updateAssignmentStatus(jwt, { ...assignment, status: 'UNAVAILABLE' }, 1);
                    setReferee1(null);
                    setDeleteConfirmationMap(prev => ({ ...prev, [referee1.userId]: false }));
                    setUnassignLoading(prev => ({ ...prev, [referee1.userId]: false }));
                  } else if (assignment) {
                    setDeleteConfirmationMap(prev => ({ ...prev, [referee1.userId]: true }));
                    if (timeoutRef.current[referee1.userId]) {
                      clearTimeout(timeoutRef.current[referee1.userId]);
                    }
                    timeoutRef.current[referee1.userId] = setTimeout(() => {
                      setDeleteConfirmationMap(prev => ({ ...prev, [referee1.userId]: false }));
                    }, 3000);
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                {unassignLoading[referee1.userId] ? (
                  <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : deleteConfirmationMap[referee1.userId] ? (
                  <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                )}
              </button>
            </div>
          ) : (
            <RefereeSelect
              assignments={assignments.filter(a => (!referee2 || a.referee.userId !== referee2.userId) && a.status !== 'UNAVAILABLE')}
              position={1}
              jwt={jwt}
              onConfirm={updateAssignmentStatus}
              onAssignmentComplete={setReferee1}
            />
          )}
        </div>
        {/* referee 2 (assigned or select box) */}
        <div className="w-full">
          {referee2 ? (
            <div className="px-3 text-sm text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {(() => {
                  const referee2Assignment = assignments.find(a => a.referee.userId === referee2?.userId);
                  const statusConfig = allRefereeAssignmentStatuses.find(status => status.key === referee2Assignment?.status);
                  console.log('Referee1 Assignment:', referee2Assignment);
                  console.log('Assignment Status:', referee2Assignment?.status);
                  console.log('Status Config:', statusConfig);
                  {/**
                  */}
                  const statusColor = statusConfig?.color.dotRefAdmin|| 'fill-gray-400';
                  return (
                    <svg className={`h-2 w-2 ${statusColor}`} viewBox="0 0 8 8" aria-hidden="true">
                      <circle cx="4" cy="4" r="4" />
                    </svg>
                  );
                })()}
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {referee2.firstName.charAt(0)}{referee2.lastName.charAt(0)}
                </div>
                {referee2.firstName} {referee2.lastName}
              </div>
              <button
                onClick={async () => {
                  const assignment = assignments.find(a => a.referee.userId === referee2.userId);
                  if (assignment && deleteConfirmationMap[referee2.userId]) {
                    setUnassignLoading(prev => ({ ...prev, [referee2.userId]: true }));
                    await updateAssignmentStatus(jwt, { ...assignment, status: 'UNAVAILABLE' }, 2);
                    setReferee2(null);
                    setDeleteConfirmationMap(prev => ({ ...prev, [referee2.userId]: false }));
                    setUnassignLoading(prev => ({ ...prev, [referee2.userId]: false }));
                  } else if (assignment) {
                    setDeleteConfirmationMap(prev => ({ ...prev, [referee2.userId]: true }));
                    if (timeoutRef.current[referee2.userId]) {
                      clearTimeout(timeoutRef.current[referee2.userId]);
                    }
                    timeoutRef.current[referee2.userId] = setTimeout(() => {
                      setDeleteConfirmationMap(prev => ({ ...prev, [referee2.userId]: false }));
                    }, 3000);
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                {unassignLoading[referee2.userId] ? (
                  <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : deleteConfirmationMap[referee2.userId] ? (
                  <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                )}
              </button>
            </div>
          ) : (
            <RefereeSelect
              assignments={assignments.filter(a => (!referee1 || a.referee.userId !== referee1.userId) && a.status !== 'UNAVAILABLE')}
              position={2}
              jwt={jwt}
              onConfirm={updateAssignmentStatus}
              onAssignmentComplete={setReferee2}
            />
          )}
        </div>
      </div>
    </div>
  )
};

export default MatchCardRefAdmin;