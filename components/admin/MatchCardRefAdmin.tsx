import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { AssignmentValues } from '../../types/AssignmentValues';
import { Referee } from '../../types/MatchValues';
import { CalendarIcon, MapPinIcon, XCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import RefereeSelect from '../ui/RefereeSelect';
import { tournamentConfigs, allRefereeAssignmentStatuses, refereeLevelColors } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const MatchCardRefAdmin: React.FC<{ match: Match, assignments: AssignmentValues[], jwt: string }> = ({ match, assignments, jwt }) => {
  const { home, away, startDate, venue } = match;
  const [referee1, setReferee1] = useState<Referee | null>(match.referee1 || null);
  const [referee2, setReferee2] = useState<Referee | null>(match.referee2 || null);
  const [deleteConfirmationMap, setDeleteConfirmationMap] = useState<{ [key: string]: boolean }>({});
  const [unassignLoading, setUnassignLoading] = useState<{ [key: string]: boolean }>({});
  const timeoutRef = React.useRef<{ [key: string]: NodeJS.Timeout }>({});

  const fetchRefereeDetails = async (userId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/referee/${userId}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      const refereeData = response.data;
      return {
        userId: refereeData._id,
        firstName: refereeData.firstName,
        lastName: refereeData.lastName,
        level: refereeData.referee?.level || 'N/A'
      };
    } catch (error) {
      console.error('Error fetching referee details:', error);
      return null;
    }
  };

  useEffect(() => {
    const updateRefereeDetails = async () => {
      if (referee1?.userId) {
        const details = await fetchRefereeDetails(referee1.userId);
        if (details) {
          setReferee1(prev => ({ ...prev, ...details }));
        }
      }
      if (referee2?.userId) {
        const details = await fetchRefereeDetails(referee2.userId);
        if (details) {
          setReferee2(prev => ({ ...prev, ...details }));
        }
      }
    };

    updateRefereeDetails();
  }, [referee1?.userId, referee2?.userId]);

  if (match._id === '67c1f27eefe0c2f17eba73bf') {
    console.log("assignments", assignments)
  }
  // Calculate if referee assignment should be disabled based on match date
  const now = new Date();
  const matchStart = new Date(startDate);
  const daysDiff = Math.ceil((matchStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let isDisabled = daysDiff <= 14 && daysDiff >= 7;

  // Feature-Switch
  if (process.env.NODE_ENV === 'production') {
    isDisabled = false;
  }

  const updateAssignmentStatus = async (jwt: string, assignment: AssignmentValues, position: number = 1) => {
    let newId: string = ''
    try {
      const method = assignment?._id ? 'patch' : 'post';
      const endpoint = `${BASE_URL}/assignments${assignment?._id ? `/${assignment._id}` : '/'}`;

      const body = {
        matchId: assignment.matchId,
        userId: assignment.referee.userId,
        status: assignment.status,
        refAdmin: true,
        position: position
      };

      { console.log("endpoint", endpoint) }
      { console.log('Body: ', body) }

      const response = await axios({
        method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        data: body
      });
      console.log("response", response.data._id)
      newId = response.data._id;

      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Failed to update assignment status');
      }

      // Update the local assignments array with the new status
      const updatedAssignments = assignments.map(a =>
        a.referee.userId === assignment.referee.userId
          ? { ...a, _id: newId, status: assignment.status }
          : a
      );
      assignments.splice(0, assignments.length, ...updatedAssignments);
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  }

  const deleteAssignment = async (jwt: string, assignment: AssignmentValues, position: number = 1) => {
    try {
      const response = await axios({
        method: 'DELETE',
        url: `${BASE_URL}/assignments/${assignment._id}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        }
      });
      if (response.status !== 204) { // Assuming delete returns a 204 No Content
        throw new Error('Failed to delete assignment');
      } else {
        console.log(response);
      }
      // Update the local assignments array with the new status
      const updatedAssignments = assignments.map(a =>
        a.referee.userId === assignment.referee.userId
          ? { ...a, _id: '', status: 'AVAILABLE' }
          : a
      );
      assignments.splice(0, assignments.length, ...updatedAssignments);

    } catch (error) {
      console.error('Error deleting assignment:', error);
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
            {(() => {
              const item = tournamentConfigs[match.tournament.alias];
              if (item) {
                return (
                  <span
                    key={item.tinyName}
                    className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset w-full", item.bdgColLight)}
                  >
                    {item.tinyName} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                  </span>
                );
              }
            })()}
          </div>
        </div>
        {/* 1-2 date, venue */}
        <div className="flex flex-row sm:flex-col justify-between sm:justify-end mt-3 sm:mt-0 sm:pr-4 sm:gap-y-2 sm:h-full">
          {/* date */}
          <div className="flex items-center truncate">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" /> {/* Icon for Date */}
            <p className="block md:hidden text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={startDate ? (new Date(startDate)).toISOString() : undefined}>{startDate ? (new Date(startDate)).toLocaleString('de-DE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: undefined,
                hour: '2-digit',
                minute: '2-digit'
              }) : 'offen'}</time>
            </p>
            <p className="hidden md:block text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={startDate ? (new Date(startDate)).toISOString() : undefined}>{startDate ? (new Date(startDate)).toLocaleString('de-DE', {
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
              {/* status indicator, avatar, name */}
              <div className="flex items-center gap-x-3">
                {(() => {
                  const ref = referee1
                  const refAssignment = assignments.find(a => a.referee.userId === ref.userId);
                  const statusConfig = allRefereeAssignmentStatuses.find(status => status.key === refAssignment?.status);
                  console.log('Referee1 Assignment:', refAssignment);

                  const statusColor = statusConfig?.color.dotRefAdmin || 'fill-gray-400';
                  return (
                    <>
                      <svg className={`h-2 w-2 ${statusColor}`} viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="4" />
                      </svg>
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {ref.firstName.charAt(0)}{ref.lastName.charAt(0)}
                      </div>
                      <span>
                        {ref.firstName} {ref.lastName}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.background || refereeLevelColors.DEFAULT.background}
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.text || refereeLevelColors.DEFAULT.text}
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.ring || refereeLevelColors.DEFAULT.ring}`}>
                        {refAssignment?.referee.level}
                      </span>
                    </>
                  );
                })()}
              </div>
              {/* unassign button */}
              {isDisabled ? (
                <LockClosedIcon className="h-4 w-4 text-red-700" aria-hidden="true" />
              ) : (
                <button
                  onClick={async () => {
                    const assignment = assignments.find(a => a.referee.userId === referee1.userId);
                    if (assignment && deleteConfirmationMap[referee1.userId]) {
                      setUnassignLoading(prev => ({ ...prev, [referee1.userId]: true }));
                      //await updateAssignmentStatus(jwt, { ...assignment, status: 'UNAVAILABLE' }, 1);
                      await deleteAssignment(jwt, assignment, 1);
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
              )}
            </div>
          ) : (
            <RefereeSelect
              matchId={match._id}
              position={1}
              jwt={jwt}
              onConfirm={updateAssignmentStatus}
              onAssignmentComplete={setReferee1}
              disabled={isDisabled}
              excludeRefereeId={referee2?.userId}
            />
          )}
        </div>
        {/* referee 2 (assigned or select box) */}
        <div className="w-full">
          {referee2 ? (
            <div className="px-3 text-sm text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {(() => {
                  const ref = referee2
                  const refAssignment = assignments.find(a => a.referee.userId === ref.userId);
                  const statusConfig = allRefereeAssignmentStatuses.find(status => status.key === refAssignment?.status);
                  console.log('Referee1 Assignment:', refAssignment);

                  const statusColor = statusConfig?.color.dotRefAdmin || 'fill-gray-400';
                  return (
                    <>
                      <svg className={`h-2 w-2 ${statusColor}`} viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="4" />
                      </svg>
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {ref.firstName.charAt(0)}{ref.lastName.charAt(0)}
                      </div>
                      <span>
                        {ref.firstName} {ref.lastName}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.background || refereeLevelColors.DEFAULT.background}
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.text || refereeLevelColors.DEFAULT.text}
                  ${refereeLevelColors[refAssignment?.referee.level as keyof typeof refereeLevelColors]?.ring || refereeLevelColors.DEFAULT.ring}`}>
                        {refAssignment?.referee.level}
                      </span>
                    </>
                  );
                })()}
              </div>
              {/* unassign button */}
              {isDisabled ? (
                <LockClosedIcon className="h-4 w-4 text-red-700" aria-hidden="true" />
              ) : (
                <button
                  onClick={async () => {
                    const assignment = assignments.find(a => a.referee.userId === referee2.userId);
                    if (assignment && deleteConfirmationMap[referee2.userId]) {
                      setUnassignLoading(prev => ({ ...prev, [referee2.userId]: true }));
                      // await updateAssignmentStatus(jwt, { ...assignment, status: 'UNAVAILABLE' }, 2);
                      await deleteAssignment(jwt, assignment, 2);
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
              )}
            </div>
          ) : (
            <RefereeSelect
              matchId={match._id}
              position={2}
              jwt={jwt}
              onConfirm={updateAssignmentStatus}
              onAssignmentComplete={setReferee2}
              disabled={isDisabled}
              excludeRefereeId={referee1?.userId}
            />
          )}
        </div>
      </div>
    </div>
  )
};

export default MatchCardRefAdmin;