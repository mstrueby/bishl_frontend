import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { RosterPlayer } from '../../types/MatchValues';
import { PlayerDetails } from '../../types/PlayerDetails';

interface PlayerContext {
  playerId: string;
  teamFlag: "home" | "away";
  player: RosterPlayer;
  teamName?: string;
  teamLogoUrl?: string;
  clubName?: string;
  clubLogoUrl?: string;
}

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerContext: PlayerContext | null;
  playerDetails?: PlayerDetails | null;
  calledMatchesCount?: number;
  currentSeasonName?: string;
  isLoading?: boolean;
}

const positionTooltips: Record<string, string> = {
  'C': 'Captain',
  'A': 'Assistant',
  'G': 'Goalie',
  'F': 'Feldspieler'
};

const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  isOpen,
  onClose,
  playerContext,
  playerDetails,
  calledMatchesCount = 0,
  currentSeasonName = '',
  isLoading = false
}) => {
  if (!playerContext) return null;

  const { player } = playerContext;
  const firstName = player.player.firstName;
  const lastName = player.player.lastName;
  const jerseyNumber = player.player.jerseyNumber;
  const positionKey = player.playerPosition.key;
  const passNumber = player.passNumber;

  const getPlayerInitials = (): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const renderPositionBadge = (key: string) => {
    const isGoalie = key === 'G';
    return (
      <span 
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
          isGoalie 
            ? 'bg-white text-gray-900 border-2 border-gray-900' 
            : 'bg-gray-900 text-white'
        }`}
        title={positionTooltips[key] || key}
      >
        {key}
      </span>
    );
  };

  const formatBirthDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Nicht angegeben';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Nicht angegeben';
      return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
    } catch {
      return 'Nicht angegeben';
    }
  };

  const getLicenceStatusColor = (status: string | undefined): string => {
    switch (status) {
      case 'VALID':
        return 'bg-green-500';
      case 'INVALID':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const aggregateSeasonStats = () => {
    if (!playerDetails?.stats || playerDetails.stats.length === 0) {
      return null;
    }

    const totals = playerDetails.stats.reduce((acc, stat) => {
      return {
        gamesPlayed: (acc.gamesPlayed ?? 0) + (stat.gamesPlayed || 0),
        goals: (acc.goals ?? 0) + (stat.goals || 0),
        assists: (acc.assists ?? 0) + (stat.assists || 0),
        points: (acc.points ?? 0) + (stat.points || 0),
      };
    }, { gamesPlayed: 0, goals: 0, assists: 0, points: 0 } as { gamesPlayed: number; goals: number; assists: number; points: number });

    return totals;
  };

  const seasonStats = aggregateSeasonStats();
  const playerImageUrl = player.player.imageUrl;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 z-10"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {isLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Header Section - Identity Focus */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                      <div className="flex items-start gap-6">
                        {/* Large Avatar */}
                        <div className="flex-shrink-0">
                          {playerImageUrl ? (
                            <Image
                              src={playerImageUrl}
                              alt={`${firstName} ${lastName}`}
                              width={112}
                              height={112}
                              className="rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <span className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gray-300 text-2xl font-bold text-gray-600 border-4 border-white shadow-lg">
                              {getPlayerInitials()}
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {firstName} {lastName}
                          </h2>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg text-gray-600">#{jerseyNumber ?? '–'}</span>
                            <span className="text-gray-400">–</span>
                            {renderPositionBadge(positionKey)}
                          </div>

                          {/* Club & Team */}
                          <div className="mt-3 flex items-center gap-2">
                            {playerContext.clubLogoUrl && (
                              <Image
                                src={playerContext.clubLogoUrl}
                                alt={playerContext.clubName || ''}
                                width={20}
                                height={20}
                                className="rounded object-contain"
                              />
                            )}
                            <span className="text-sm text-gray-700">
                              {playerContext.clubName || ''} {playerContext.teamName && `– ${playerContext.teamName}`}
                            </span>
                          </div>

                          {/* Call-up Summary */}
                          <div className="mt-2 text-sm text-gray-600">
                            Hochgespielte Spiele: <span className="font-semibold">{calledMatchesCount}</span>
                          </div>

                          {/* Personal Data */}
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="col-span-2">
                              <span className="text-gray-500">Geburtsdatum:</span>{' '}
                              <span className="text-gray-900">{formatBirthDate(playerDetails?.birthDate || player.player.birthDate)}</span>
                            </div>
                          </div>

                          {/* Full Face Requirement Badge */}
                          <div className="mt-3">
                            {playerDetails?.fullFaceReq === true ? (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                Vollvisier-Pflicht
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                Keine Vollvisier-Pflicht
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lizenzen Block */}
                    <div className="p-6 border-b">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Lizenzen</h3>
                      
                      {playerDetails?.assignedTeams && playerDetails.assignedTeams.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <tbody className="divide-y divide-gray-100">
                              {playerDetails.assignedTeams.map((assignment, idx) => (
                                <tr key={idx} className="text-sm">
                                  <td className="py-2 pr-3">
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${getLicenceStatusColor(assignment.status)}`}></span>
                                  </td>
                                  <td className="py-2 pr-4 text-gray-900">
                                    {assignment.team?.fullName || assignment.team?.name || '–'}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                      {assignment.licenceType || '–'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-gray-600">
                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                      {assignment.passNumber || passNumber || '–'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Keine Lizenzdaten verfügbar.</p>
                      )}
                    </div>

                    {/* Statistiken Block */}
                    <div className="p-6 border-b">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Statistiken {currentSeasonName && `– Saison ${currentSeasonName}`}
                      </h3>
                      
                      {seasonStats ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{seasonStats.gamesPlayed}</div>
                            <div className="text-xs text-gray-500 mt-1">Gespielte Spiele</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{seasonStats.goals}</div>
                            <div className="text-xs text-gray-500 mt-1">Tore</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{seasonStats.assists}</div>
                            <div className="text-xs text-gray-500 mt-1">Vorlagen</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{seasonStats.points}</div>
                            <div className="text-xs text-gray-500 mt-1">Punkte</div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Keine Statistikdaten für diese Saison verfügbar.</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 flex justify-end">
                      <button
                        type="button"
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={onClose}
                      >
                        Schließen
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PlayerCardModal;
