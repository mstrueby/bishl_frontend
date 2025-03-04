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
  { id: 'roster', name: 'Aufstellung' },
  { id: 'goals', name: 'Tore' },
  { id: 'penalties', name: 'Strafen' },
]

export default function MatchDetails({ match, jwt, userRoles }: MatchDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roster');
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
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={classNames(
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'w-1/3 border-b-2 px-1 py-4 text-center text-sm font-medium',
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="py-6">
          {activeTab === 'roster' && (
            <div className="py-4">
              {/* Container for side-by-side or stacked rosters */}
              <div className="flex flex-col md:flex-row md:space-x-4">
                {/* Home team roster */}
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.home.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.home.roster && match.home.roster.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {match.home.roster.map((player) => (
                            <tr key={player.player.playerId}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{player.player.jerseyNumber}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{player.playerPosition.key}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{player.player.lastName}, {player.player.firstName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Aufstellung verfügbar
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Away team roster */}
                <div className="w-full md:w-1/2">
                  <div className="text-center mb-3">
                    <h4 className="text-md font-semibold">{match.away.fullName}</h4>
                  </div>
                  <div className="overflow-hidden bg-white shadow-md rounded-md border">
                    {match.away.roster && match.away.roster.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {match.away.roster.map((player) => (
                            <tr key={player.player.playerId}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{player.player.jerseyNumber}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{player.playerPosition.key}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{player.player.lastName}, {player.player.firstName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Keine Aufstellung verfügbar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'goals' && (
            <div className="text-center py-4">
              <h3 className="text-lg font-medium text-gray-900">Tore</h3>
              <p className="mt-2 text-gray-500">Torstatistiken werden hier angezeigt</p>
            </div>
          )}
          
          {activeTab === 'penalties' && (
            <div className="text-center py-4">
              <h3 className="text-lg font-medium text-gray-900">Strafen</h3>
              <p className="mt-2 text-gray-500">Strafstatistiken werden hier angezeigt</p>
            </div>
          )}
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