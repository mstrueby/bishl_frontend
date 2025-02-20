import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { Match } from '../../types/MatchValues';
import Layout from '../../components/Layout';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { tournamentConfigs } from '../../tools/consts';
import { classNames } from '../../tools/utils';

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

  const handleSave = async () => {
    try {
      const response = await axios.patch(`${process.env.API_URL}/matches/${match._id}`, {
        venue: editData.venue,
        startDate: new Date(editData.startDate),
        matchStatus: editData.matchStatus,
        finishType: editData.finishType,
        'home.stats.goalsFor': editData.homeScore,
        'home.stats.goalsAgainst': editData.awayScore,
        'away.stats.goalsFor': editData.awayScore,
        'away.stats.goalsAgainst': editData.homeScore
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });

      if (response.status === 200) {
        router.reload();
      }
    } catch (error) {
      console.error('Error updating match:', error);
    }
    setIsEditDialogOpen(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Badge */}
        <div className="mb-6">
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

        {/* Match Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span>{new Date(match.startDate).toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span>{match.venue.name}</span>
            </div>
          </div>

          {/* Teams and Score */}
          <div className="flex justify-between items-center">
            {/* Home Team */}
            <div className="text-center">
              <Image 
                src={match.home.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} 
                alt={match.home.tinyName} 
                width={100} 
                height={100} 
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-bold">{match.home.fullName}</h2>
            </div>

            {/* Score */}
            {match.matchStatus.key === 'FINISHED' && (
              <div className="text-4xl font-bold space-x-4">
                <span>{match.home.stats.goalsFor}</span>
                <span>:</span>
                <span>{match.away.stats.goalsFor}</span>
              </div>
            )}

            {/* Away Team */}
            <div className="text-center">
              <Image 
                src={match.away.logo || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} 
                alt={match.away.tinyName} 
                width={100} 
                height={100} 
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-bold">{match.away.fullName}</h2>
            </div>
          </div>

          {/* Admin Button */}
          {(userRoles?.includes('LEAGUE_ADMIN') || userRoles?.includes('ADMIN')) && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Spiel bearbeiten
              </button>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">Spiel bearbeiten</Dialog.Title>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editData.matchStatus.key}
                    onChange={(e) => {
                      const newStatus = {
                        key: e.target.value,
                        value: e.target.options[e.target.selectedIndex].text
                      };
                      setEditData({...editData, matchStatus: newStatus});
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="SCHEDULED">Geplant</option>
                    <option value="LIVE">Live</option>
                    <option value="FINISHED">Beendet</option>
                    <option value="CANCELLED">Abgesagt</option>
                    <option value="FORFEITED">Gewertet</option>
                  </select>
                </div>

                {editData.matchStatus.key === 'FINISHED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Spielende</label>
                    <select
                      value={editData.finishType.key}
                      onChange={(e) => {
                        const newFinishType = {
                          key: e.target.value,
                          value: e.target.options[e.target.selectedIndex].text
                        };
                        setEditData({...editData, finishType: newFinishType});
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="REGULAR">Regulär</option>
                      <option value="OVERTIME">Verlängerung</option>
                      <option value="SHOOTOUT">Penaltyschießen</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum und Zeit</label>
                  <input
                    type="datetime-local"
                    value={editData.startDate}
                    onChange={(e) => setEditData({...editData, startDate: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                {editData.matchStatus.key === 'FINISHED' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tore Heim</label>
                      <input
                        type="number"
                        value={editData.homeScore}
                        onChange={(e) => setEditData({...editData, homeScore: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tore Auswärts</label>
                      <input
                        type="number"
                        value={editData.awayScore}
                        onChange={(e) => setEditData({...editData, awayScore: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditDialogOpen(false)}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </Layout>
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