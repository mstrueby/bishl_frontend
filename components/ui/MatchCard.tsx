import React from 'react';
import Image from 'next/image';
import { Match } from '../../types/MatchValues';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'; // Import the desired icons

const tournaments = [
  { name: 'Regionalliga Ost', tiny_name: 'RLO', href: '/tournaments/regionalliga-ost', bdg_col_dark: 'bg-red-400/10 text-red-400 ring-red-400/20', bdg_col_light: 'bg-red-50 text-red-700 ring-red-600/10' },
  { name: 'Landesliga', tiny_name: 'LL', href: '/tournaments/landesliga', bdg_col_dark: 'bg-gray-400/10 text-gray-400 ring-gray-400/20', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-500/10' },
  { name: 'Juniorenliga', tiny_name: 'U19', href: '/tournaments/juniorenliga', bdg_col_dark: 'bg-green-500/10 text-green-400 ring-green-500/20', bdg_col_light: 'bg-green-50 text-green-700 ring-green-600/20' },
  { name: 'Jugendliga', tiny_name: 'U16', href: '/tournaments/jugendliga', bdg_col_dark: 'bg-blue-400/10 text-blue-400 ring-blue-400/30', bdg_col_light: 'bg-blue-50 text-blue-700 ring-blue-700/10' },
  { name: 'Schülerliga', tiny_name: 'U13', href: '/tournaments/schuelerliga', bdg_col_dark: 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30', bdg_col_light: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' },
  { name: 'Bambini', tiny_name: 'U10', href: '/tournaments/bambini', bdg_col_dark: 'bg-purple-400/10 text-purple-400 ring-purple-400/30', bdg_col_light: 'bg-purple-50 text-purple-700 ring-purple-700/10' },
  { name: 'Mini', tiny_name: 'U8', href: '/tournaments/mini', bdg_col_dark: 'bg-pink-400/10 text-pink-400 ring-pink-400/20', bdg_col_light: 'bg-pink-50 text-pink-700 ring-pink-700/10' },
]

const status = [
  { key: 'LIVE', value: 'Live', bdg_col_light: 'bg-red-600 text-white ring-red-700' },
  { key: 'FINISHED', value: 'beendet', bdg_col_light: 'bg-gray-600 text-white ring-gray-700' },
  { key: 'CANCELLED', value: 'abgesagt', bdg_col_light: 'bg-amber-100 text-amber-700 ring-amber-700/10' },
  { key: 'FORFEITED', value: 'gewertet', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-400' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const { home, away, venue, startDate } = match;
  return (
    <div className="flex gap-x-4 p-4 my-10 border rounded-xl shadow-md">
      <div className="flex flex-col justify-between items-start w-1/4">
        <div className="">
          {tournaments.map(item =>
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
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" /> {/* Icon for Date */}
<p className="text-xs uppercase font-light text-gray-700 mb-0"><time dateTime={(new Date(startDate)).toISOString()}>{(new Date(startDate)).toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></p>
        </div>
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
          <p className="text-xs uppercase font-light text-gray-700">{venue.name}</p>
        </div>
      </div>

      <div className="flex flex-col justify-start items-start w-1/2 pr-16">
        <div className="flex flex-row items-center mb-4 w-full">
          <Image className="h-10 w-10 flex-none" src={home.logo ? home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={home.tinyName} objectFit="contain" height={40} width={40} />
          <div className="flex-auto ml-6">
            <p className={`text-lg font-medium leading-6 ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} mx-2`}>{home.fullName}</p>
          </div>
          <div className="flex-auto">
            <p className={`text-lg font-medium leading-6 ${home.stats.goalsFor > away.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{home.stats.goalsFor}</p>
          </div>
        </div>

        <div className="flex flex-row items-center w-full">
          <Image className="h-10 w-10 flex-none" src={away.logo ? away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={away.tinyName} objectFit="contain" height={40} width={40} />
          <div className="flex-auto ml-6">
            <p className={`text-lg font-medium leading-6 ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} mx-2`}>{away.fullName}</p>
          </div>
          <div className="flex-auto">
            <p className={`text-lg font-medium leading-6 ${away.stats.goalsFor > home.stats.goalsFor ? 'text-gray-800' : 'text-gray-500'} text-right mx-2`}>{away.stats.goalsFor}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end w-1/4">
        {status.map(item => (
          item.key === match.matchStatus.key && (
            <span key={item.key} className={classNames("inline-flex items-center gap-x-1.5 rounded-md text-xs font-medium ring-1 ring-inset py-1 px-3 uppercase", item.bdg_col_light)}>
              {match.matchStatus.value}
              {item.key === 'FINISHED' && match.finishType.key !== 'REGULAR' && (
                <span>
                  {match.finishType.key === 'SHOOTOUT' ? '(PS)' : match.finishType.key === 'OVERTIME' ? '(V)' : match.finishType.value}
                </span>
              )}
            </span>
          )))
        }
      </div>
    </div>
  );
};

export default MatchCard