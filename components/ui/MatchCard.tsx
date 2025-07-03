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
import MatchStatus from '../admin/ui/MatchStatus';
import { useRouter } from 'next/router';
import MatchStatusBadge from './MatchStatusBadge';

const StatusMenu = ({ match, setMatch, showLinkEdit, showLinkStatus, showLinkHome, showLinkAway, onMatchUpdate }: { match: Match, setMatch: React.Dispatch<React.SetStateAction<Match>>, showLinkEdit: boolean, showLinkStatus: boolean, showLinkHome: boolean, showLinkAway: boolean, onMatchUpdate?: () => Promise<void> }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // deactivate new features for PROD
  // Feature-Switch
  //if (!user?.roles.includes('ADMIN')) {
  //  showLinkHome = false;
  //  showLinkAway = false;
  //}

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
              {showLinkEdit && (
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
              )}
              {showLinkStatus && (
                <>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsStatusOpen(true)}
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full text-left px-4 py-2 text-sm'
                        )}
                      >
                        Ergebnis
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push(`/matches/${match._id}/matchcenter/`)}
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full text-left px-4 py-2 text-sm'
                        )}
                      >
                        Match Center
                      </button>
                    )}
                  </Menu.Item>
                </>

              )}
              {showLinkHome && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push(`/matches/${match._id}/home/roster`)}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full text-left px-4 py-2 text-sm'
                      )}
                    >
                      Aufstellung {match.home.tinyName}
                    </button>
                  )}
                </Menu.Item>
              )}
              {showLinkAway && (
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push(`/matches/${match._id}/away/roster`)}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full text-left px-4 py-2 text-sm'
                      )}
                    >
                      Aufstellung {match.away.tinyName}
                    </button>
                  )}
                </Menu.Item>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      <MatchEdit
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        match={match}
        jwt={user?.jwt || ''}
        onSuccess={async (updatedMatch) => {
          setMatch({ ...match, ...updatedMatch });
          if (onMatchUpdate) {
            await onMatchUpdate();
          }
        }}
        onMatchUpdate={onMatchUpdate}
      />
      <MatchStatus
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        match={match}
        jwt={user?.jwt || ''}
        onSuccess={async (updatedMatch) => {
          setMatch({ ...match, ...updatedMatch });
          if (onMatchUpdate) {
            await onMatchUpdate();
          }
        }}
        onMatchUpdate={onMatchUpdate}
      />
    </>
  );
};

const MatchCard: React.FC<{
  match: Match,
  onMatchUpdate?: () => Promise<void>,
  matchdayOwner?: {
    clubId: string;
    clubName: string;
    clubAlias: string;
  }
}> = ({ match: initialMatch, onMatchUpdate, matchdayOwner }) => {
  const [match, setMatch] = useState(initialMatch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { home, away, venue, startDate } = match;
  const { user } = useAuth();

  // Auto-refresh for in-progress matches
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const refreshMatch = async () => {
      if (isRefreshing) return;

      try {
        setIsRefreshing(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`);
        const updatedMatch = await response.json();
        setMatch(updatedMatch);
        if (onMatchUpdate) {
          await onMatchUpdate();
        }
      } catch (error) {
        console.error('Error refreshing match:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    if (match.matchStatus.key === 'INPROGRESS') {
      interval = setInterval(refreshMatch, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [match._id, match.matchStatus.key, onMatchUpdate, isRefreshing]);

  let showButtonEdit = false;
  let showButtonStatus = false;
  let showButtonRosterHome = false;
  let showButtonRosterAway = false;
  let showMatchCenter = true;

  {/**  LEAGE_ADMIN */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN'))) {
    showButtonEdit = true;
    showButtonStatus = true;
  }
  {/** LEAGUE-ADMIN && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterHome = true;
    showButtonRosterAway = true;
  }
  {/** LEAGE_ADMIN && Spiel läuft */ }
  if (user && (user.roles.includes('LEAGUE_ADMIN') || user.roles.includes('ADMIN')) && match.matchStatus.key === 'INPROGRESS') {
    showButtonRosterHome = true;
    showButtonRosterAway = true;
  }
  {/** Home-Account */ }
  if (user && (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN'))) {
    showButtonRosterHome = true;
  }
  {/** Home-Account && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.club && user.club.clubId === match.home.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
    showButtonStatus = true;
  }
  {/** Matchday-Owner and match is at the same day */ }
  if (user && (user.club && user.club.clubId === matchdayOwner?.clubId) && new Date(match.startDate).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0)) {
    showButtonRosterHome = true;
    showButtonRosterAway = true;
    showButtonStatus = true;
  }
  {/** Away-Club && Spiel ist weiter als 30 Minuten in der Zukunft */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() > Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
  }
  {/** Away-Account && Spiel startet in den nächsten 30 Minuten */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && new Date(match.startDate).getTime() < Date.now() + 30 * 60 * 1000) {
    showButtonRosterAway = true;
  }
  {/** Away-Account && Spiel läuft */ }
  if (user && (user.club && user.club.clubId === match.away.clubId && user.roles.includes('CLUB_ADMIN')) && match.matchStatus.key === 'INPROGRESS') {
    showButtonRosterAway = false;
  }
  {/** Spiel ist beendet */ }
  if (match.matchStatus.key !== 'INPROGRESS' && match.matchStatus.key !== 'SCHEDULED') {
    showButtonEdit = false;
    showButtonRosterHome = false;
    showButtonRosterAway = false;
    showButtonStatus = false;
  }
  {/** ADMIN, LEAGE_ADMIN && Spiel beendet */ }
  if (user && (user.roles.includes('ADMIN') || user.roles.includes('LEAGUE_ADMIN')) && (match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'INPROGRESS')) {
    showButtonEdit = true;
    showButtonStatus = true;
  }

  if (match.season.alias !== process.env['NEXT_PUBLIC_CURRENT_SEASON']) {
    showButtonEdit = false;
    showButtonStatus = false;
    showButtonRosterHome = false;
    showButtonRosterAway = false;
  }

  // Feature-Switch
  //if (process.env.NODE_ENV === 'production' && !user?.roles.includes('ADMIN')) {
  //  showMatchSheet = false;
  //}

  return (
    <div className="flex flex-col sm:flex-row gap-y-2 p-4 border-2 rounded-xl shadow-md">
      {/* 1 tournament, status (mobile), date, venue */}
      <div className="flex flex-col sm:flex-none sm:w-1/3">
        {/* 1-1 tournament, status (mobile) */}
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
          {/* status */}
          <div className="sm:hidden">
            <div className="flex items-center">
              {(showButtonEdit || showButtonStatus || showButtonRosterHome || showButtonRosterAway) && (
                <StatusMenu
                  match={match}
                  setMatch={setMatch}
                  showLinkEdit={showButtonEdit}
                  showLinkStatus={showButtonStatus}
                  showLinkHome={showButtonRosterHome}
                  showLinkAway={showButtonRosterAway}
                  onMatchUpdate={onMatchUpdate}
                />
              )}
              <MatchStatusBadge
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
                startDate ? `${new Date(startDate).toDateString()}T${new Date(startDate).toTimeString()}` : ''
              }>
                {startDate ? new Date(startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                  year: undefined,
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'offen'}
              </time>
            </p>
            <p className="hidden md:block text-xs uppercase font-light text-gray-700 my-0">
              <time dateTime={
                startDate ? `${new Date(startDate).toDateString()}T${new Date(startDate).toTimeString()}` : ''
              }>
                {startDate ? new Date(startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
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
      <div className="flex flex-col gap-y-2 sm:gap-x-2 justify-between mt-3 sm:mt-0 sm:w-5/12 md:w-full">
        {/* home */}
        <div className="flex flex-row items-center w-full">
          <div className="flex-none">
            <Image className="flex-none" src={home.logo ? home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={home.tinyName} objectFit="contain" height={32} width={32} />
          </div>
          <div className="flex-auto ml-6 truncate text-ellipsis">
            <p className={`block md:hidden sm:max-md:text-base font-medium ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{home.shortName}</p>
            <p className={`hidden md:block sm:max-md:text-base font-medium ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{home.fullName}</p>
          </div>
          {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
            <div className="flex-none w-10">
              <p className={`text-lg sm:max-md:text-base font-medium ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{home.stats.goalsFor}</p>
            </div>
          )}
        </div>
        {/* away */}
        <div className="flex flex-row items-center w-full">
          <div className="flex-none">
            <Image className="flex-none" src={away.logo ? away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={away.tinyName} objectFit="contain" height={32} width={32} />
          </div>
          <div className="flex-auto ml-6 w-full truncate">
            <p className={`block md:hidden sm:max-md:text-base font-medium ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{away.shortName}</p>
            <p className={`hidden md:block sm:max-md:text-base font-medium ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'}`}>{away.fullName}</p>
          </div>
          {!(match.matchStatus.key === 'SCHEDULED' || match.matchStatus.key === 'CANCELLED') && (
            <div className="flex-none w-10">
              <p className={`text-lg sm:max-md:text-base font-medium ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{away.stats.goalsFor}</p>
            </div>
          )}
        </div>
        {/* Referees section */}
        {(match.referee1 || match.referee2) && (
          <div className="flex flex-row gap-x-4 mt-3 sm:mt-0 sm:w-1/4 md:w-1/5">
            {match.referee1 && (
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {match.referee1.firstName.charAt(0)}{match.referee1.lastName.charAt(0)}
                </div>
                <span className="text-xs text-gray-600 ml-2 truncate">
                  {match.referee1.firstName} {match.referee1.lastName.charAt(0)}
                </span>
              </div>
            )}
            {match.referee2 && (
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {match.referee2.firstName.charAt(0)}{match.referee2.lastName.charAt(0)}
                </div>
                <span className="text-xs text-gray-600 ml-2 truncate">
                  {match.referee2.firstName} {match.referee2.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* 3 button Spielberich, status (tablet) */}
      <div className="flex flex-col justify-between sm:flex-none mt-3 sm:mt-0 sm:w-1/4 md:w-1/5">
        <div className="sm:flex hidden flex-row justify-end">
          {(showButtonEdit || showButtonStatus || showButtonRosterHome || showButtonRosterAway) && (
            <StatusMenu
              match={match}
              setMatch={setMatch}
              showLinkEdit={showButtonEdit}
              showLinkStatus={showButtonStatus}
              showLinkHome={showButtonRosterHome}
              showLinkAway={showButtonRosterAway}
              onMatchUpdate={onMatchUpdate}
            />
          )}
          <MatchStatusBadge
            statusKey={match.matchStatus.key}
            finishTypeKey={match.finishType.key}
            statusValue={match.matchStatus.value}
            finishTypeValue={match.finishType.value}
          />
        </div>

        {showMatchCenter && (
          <div className="flex flex-col sm:flex-none justify-center sm:items-end">
            <Link href={`/matches/${match._id}`}>
              <a className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 py-1 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="block sm:hidden md:block">Spielbericht</span>
                <span className="hidden sm:block md:hidden">Bericht</span>
              </a>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchCard