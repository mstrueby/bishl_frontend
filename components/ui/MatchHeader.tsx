import React from 'react';
import { CldImage } from 'next-cloudinary';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { MatchValues } from '../../types/MatchValues';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import MatchStatusBadge from './MatchStatusBadge';

interface MatchHeaderProps {
  match: MatchValues;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({ match, isRefreshing, onRefresh }) => {
  return (
    <>
      {/* Match Header */}
      <div className="flex items-start justify-between sm:flex-row gap-y-2 p-4 border-b mb-6 sm:mb-8 md:mb-12">
        {/* Refresh Button */}
        {match.matchStatus.key !== 'SCHEDULED' && match.matchStatus.key !== 'CANCELLED' && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            title="Aktualisieren"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Tournament Badge */}
        <div className="">
          {(() => {
            const item = tournamentConfigs[match.tournament.alias];
            if (item) {
              return (
                <span
                  key={item.tinyName}
                  className={classNames("inline-flex items-center justify-start rounded-md px-2 py-1 text-xs font-medium uppercase ring-1 ring-inset", item.bdgColLight)}
                >
                  {item.tinyName} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                </span>
              );
            }
          })()}
        </div>

        {/* Match StartDate, Venue */}
        <div className="flex flex-col items-end gap-y-2">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="hidden sm:block text-sm uppercase font-light text-gray-700">
              <time dateTime={
                match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
              }>
                {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'offen'}
              </time> Uhr
            </span>
            <span className="block sm:hidden text-sm uppercase font-light text-gray-700">
              <time dateTime={
                match.startDate ? `${new Date(match.startDate).toDateString()}T${new Date(match.startDate).toTimeString()}` : ''
              }>
                {match.startDate ? new Date(match.startDate).toLocaleString('de-DE', {
                  timeZone: 'Europe/Berlin',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'offen'}
              </time>
            </span>
          </div>
          <div className="flex items-center truncate">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
            <p className="text-sm uppercase font-light text-gray-700 truncate">{match.venue.name}</p>
          </div>
        </div>
      </div>

      {/* Teams and Score */}
      <div className="flex justify-between items-center">
        {/* Home Team */}
        <div className="text-center w-1/3">
          <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
            <CldImage
              src={match.home.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
              alt={match.home.tinyName}
              width={100}
              height={100}
              gravity="center"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="block sm:hidden text-xl font-bold truncate">{match.home.tinyName}</h2>
          <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.home.shortName}</h2>
          <h2 className="hidden md:block text-xl font-bold truncate">{match.home.fullName}</h2>
        </div>

        {/* Score */}
        <div className="text-center w-1/3">
          <div className="mb-2 sm:mb-4">
            <MatchStatusBadge
              statusKey={match.matchStatus.key}
              finishTypeKey={match.finishType.key}
              statusValue={match.matchStatus.value}
              finishTypeValue={match.finishType.value}
            />
          </div>
          {(() => {
            switch (match.matchStatus.key) {
              case 'SCHEDULED':
              case 'CANCELLED':
                return null;
              default:
                return (
                  <div className="text-2xl sm:text-4xl font-bold space-x-1 sm:space-x-4">
                    <span>{match.home.stats.goalsFor}</span>
                    <span>:</span>
                    <span>{match.away.stats.goalsFor}</span>
                  </div>
                );
            }
          })()}
        </div>

        {/* Away Team */}
        <div className="text-center w-1/3">
          <div className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] mx-auto mb-4">
            <CldImage
              src={match.away.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
              alt={match.away.tinyName}
              width={100}
              height={100}
              gravity="center"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="block sm:hidden text-xl font-bold truncate">{match.away.tinyName}</h2>
          <h2 className="hidden sm:max-md:block text-xl font-bold truncate">{match.away.shortName}</h2>
          <h2 className="hidden md:block text-xl font-bold truncate">{match.away.fullName}</h2>
        </div>
      </div>
    </>
  );
};

export default MatchHeader;
