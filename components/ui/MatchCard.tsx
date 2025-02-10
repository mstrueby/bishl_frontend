import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { Match } from '../../types/MatchValues';
import { CalendarIcon, MapPinIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { Menu, Transition } from '@headlessui/react';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import MatchEdit from '../admin/ui/MatchEdit';

const StatusMenu = ({ match, setMatch }: { match: Match, setMatch: React.Dispatch<React.SetStateAction<Match>> }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Menu as="div" className="relative inline-block text-left ml-1">
        <Menu.Button className="flex items-center text-gray-500">
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
          <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block w-full text-left px-4 py-2 text-sm'
                    )}
                  >
                    Ansetzung
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link href={`/matches/${match._id}`}>
                    <a className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm'
                    )}>
                      Ergebnis
                    </a>
                  </Link>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      <MatchEdit
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        match={match}
        jwt={user?.jwt || ''}
        onSuccess={(updatedMatch) => {
          setMatch(updatedMatch);
        }}
      />
    </>
  );
};

const status = [
  { key: 'LIVE', value: 'Live', bdg_col_light: 'bg-red-600 text-white ring-red-700' },
  { key: 'FINISHED', value: 'beendet', bdg_col_light: 'bg-gray-600 text-white ring-gray-700' },
  { key: 'CANCELLED', value: 'abgesagt', bdg_col_light: 'bg-amber-100 text-amber-700 ring-amber-700/10' },
  { key: 'FORFEITED', value: 'gewertet', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-400' },
]

const StatusBadge: React.FC<{ statusKey: string, finishTypeKey?: string, statusValue: string, finishTypeValue?: string }> = ({ statusKey, finishTypeKey, statusValue, finishTypeValue }) => {
  return (
    <>
      {status.map(item => (
        item.key === statusKey && (
          <span
            key={item.key}
            className={classNames("inline-flex items-center gap-x-1.5 rounded-md text-xs font-medium ring-1 ring-inset py-0.5 px-2 uppercase", item.bdg_col_light)}
          >
            {statusValue}
            {item.key === 'FINISHED' && finishTypeKey !== 'REGULAR' && (
              <span>
                {finishTypeKey === 'SHOOTOUT' ? '(PS)' : finishTypeKey === 'OVERTIME' ? '(V)' : finishTypeValue}
              </span>
            )}
          </span>
        )
      ))}
    </>
  );
};

const MatchCard: React.FC<{ match: Match }> = ({ match: initialMatch }) => {
  const [match, setMatch] = useState(initialMatch);
  const { home, away, venue, startDate } = match;

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
            <div className="flex items-center">
              {useAuth().user?.roles?.some((role: string) => ['ADMIN', 'LEAGUE_ADMIN'].includes(role)) && (
                <StatusMenu
                  match={match}
                  setMatch={setMatch}
                />
              )}
              <StatusBadge
                statusKey={match.matchStatus.key}
                finishTypeKey={match.finishType.key}
                statusValue={match.matchStatus.value}
                finishTypeValue={match.finishType.value}
              />
            </div>
          </div>
        </div>
        {/* 1-2 date, venue */}
        <div className="flex flex-row sm:flex-col justify-between sm:justify-end mt-3 sm:mt-0 sm:pr-4 sm:gap-y-2 sm:h-full">
          {/* date */}
          <div className="flex items-center truncate">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" /> {/* Icon for Date */}
            <p className="block md:hidden text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={
                `${new Date(startDate).toDateString()}T${new Date(startDate).toTimeString()}`
              }>
                {new Date(startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: undefined,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </p>
            <p className="hidden md:block text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={
                `${new Date(startDate).toDateString()}T${new Date(startDate).toTimeString()}`
              }>
                {new Date(startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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
      <div className="flex flex-col gap-y-2 sm:gap-x-2 justify-between mt-3 sm:mt-0 w-full sm:w-1/2">
        {/* home */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={home.logo ? home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={home.tinyName} objectFit="contain" height={40} width={40} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{home.fullName}</p>
          </div>
          {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
            <div className="flex-auto">
              <p className={`text-lg sm:max-md:text-base font-medium ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{home.stats.goalsFor}</p>
            </div>
          )}
        </div>
        {/* away */}
        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={away.logo ? away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={away.tinyName} objectFit="contain" height={40} width={40} />
          <div className="flex-auto ml-6">
            <p className={`text-lg sm:max-md:text-base font-medium ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{away.fullName}</p>
          </div>
          {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
            <div className="flex-auto">
              <p className={`text-lg sm:max-md:text-base font-medium ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{away.stats.goalsFor}</p>
            </div>
          )}
        </div>
      </div>
      {/* 3 button Spielberich, status (tablet) */}
      <div className="flex flex-col justify-between mt-3 sm:mt-0 sm:w-1/4 md:w-1/6">
        <div className="sm:flex hidden flex-row justify-end">
          {useAuth().user?.roles?.some((role: string) => ['ADMIN', 'LEAGUE_ADMIN'].includes(role)) && (
            <StatusMenu
              match={match}
              setMatch={setMatch}
            />
          )}
          <StatusBadge
            statusKey={match.matchStatus.key}
            finishTypeKey={match.finishType.key}
            statusValue={match.matchStatus.value}
            finishTypeValue={match.finishType.value}
          />
        </div>
        {/*
        <div className="flex flex-col sm:flex-none justify-center sm:items-end">
          <Link href={`/matches/${match._id}`}>
            <a className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 py-1 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <span className="block sm:hidden md:block">Spielbericht</span>
              <span className="hidden sm:block md:hidden">Bericht</span>
            </a>
          </Link>
        </div>
        */}
      </div>
    </div>
  );
};

export default MatchCard