import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Dialog } from '@headlessui/react';
import { Match } from '../../types/MatchValues';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';
import MatchStatusBadge from '../../components/ui/MatchStatusBadge';

interface MatchDetailsProps {
  match: Match;
  jwt?: string;
  userRoles?: string[];
}

interface EditMatchData {
  venue: { name: string; alias: string };
  startDate: string;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  homeScore: number;
  awayScore: number;
}

const tabs = [
  { name: 'Aufstellung', href: '#', current: false },
  { name: 'Tore', href: '#', current: false },
  { name: 'Strafen', href: '#', current: true },
]

export default function MatchDetails({ match, jwt, userRoles }: MatchDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditMatchData>({
    venue: match.venue,
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
    matchStatus: match.matchStatus,
    finishType: match.finishType,
    homeScore: match.home.stats.goalsFor,
    awayScore: match.away.stats.goalsFor
  });
  const router = useRouter();



  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-4">

        {/* Match Header */}
        <div className="flex items-start justify-between sm:flex-row gap-y-2 p-4 border-b mb-6 sm:mb-8 md:mb-12">

          {/* Tournament Badge */}
          <div className="">
            {tournamentConfigs.map(item =>
              item.name === match.tournament.name && (
                <span
                  key={item.tiny_name}
                  className={classNames("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", item.bdg_col_light)}
                >
                  {item.tiny_name} {match.round.name !== 'Hauptrunde' && `- ${match.round.name}`}
                </span>
              )
            )}
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

        {/* Match Title */}
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

        {/* Sub navigation */}
        <div className="mt-10 border-b border-gray-200">
          <nav aria-label="Tabs" className="-mb-px flex justify-center px-0 sm:px-4 md:px-12">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                href={tab.href}
                aria-current={tab.current ? 'page' : undefined}
                className={classNames(
                  tab.current
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'w-1/3 border-b-2 px-1 py-4 text-center text-sm font-medium',
                )}
              >
                {tab.name}
              </a>
            ))}
          </nav>
        </div>

      </div>
    </Layout >
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const jwt = (getCookie('jwt', context) || '') as string;

  try {
    const match = await fetch(`${process.env.API_URL}/matches/${id}`).then(res => res.json());

    let userRoles: string[] = [];
    if (jwt) {
      const userResponse = await fetch(`${process.env.API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const userData = await userResponse.json();
      userRoles = userData.roles || [];
    }

    return {
      props: {
        match,
        jwt,
        userRoles,
      }
    };
  } catch (error) {
    return {
      notFound: true
    };
  }
};