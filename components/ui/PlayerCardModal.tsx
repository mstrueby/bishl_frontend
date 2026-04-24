import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { RosterPlayer } from '../../types/MatchValues';
import { PlayerDetails } from '../../types/PlayerDetails';
import apiClient from '../../lib/apiClient';
import { getErrorMessage } from '../../lib/errorHandler';

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayer: RosterPlayer | null;
  roster: RosterPlayer[];
  teamName?: string;
  teamLogoUrl?: string;
}

const positionTooltips: Record<string, string> = {
  'C': 'Captain',
  'A': 'Assistant',
  'G': 'Goalie',
  'F': 'Feldspieler'
};

const getLicenceStatusColor = (status: string | undefined): string => {
  switch (status) {
    case 'VALID': return 'bg-green-500';
    case 'INVALID': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
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

const getPlayerInitials = (firstName: string, lastName: string): string =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  isOpen,
  onClose,
  initialPlayer,
  roster,
  teamName,
  teamLogoUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [playerDetails, setPlayerDetails] = useState<PlayerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialPlayer) return;
    const idx = roster.findIndex(p => p.player.playerId === initialPlayer.player.playerId);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [isOpen, initialPlayer]);

  const currentPlayer: RosterPlayer | null = roster.length > 0 ? (roster[currentIndex] ?? null) : initialPlayer;

  useEffect(() => {
    if (!isOpen || !currentPlayer) return;

    const controller = new AbortController();
    setIsLoading(true);
    setPlayerDetails(null);

    apiClient.get(`/players/${currentPlayer.player.playerId}`, { signal: controller.signal })
      .then(response => {
        setPlayerDetails(response.data);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Error fetching player details:', getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex]);

  const handlePrev = () => {
    if (roster.length === 0) return;
    setCurrentIndex(i => (i - 1 + roster.length) % roster.length);
  };

  const handleNext = () => {
    if (roster.length === 0) return;
    setCurrentIndex(i => (i + 1) % roster.length);
  };

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

                {/* Navigation + Close bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    {roster.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Vorheriger Spieler"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <span className="text-xs text-gray-500">
                          {currentIndex + 1} / {roster.length}
                        </span>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Nächster Spieler"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {!currentPlayer ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                      <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {currentPlayer.player.imageUrl ? (
                            <Image
                              src={currentPlayer.player.imageUrl}
                              alt={`${currentPlayer.player.firstName} ${currentPlayer.player.lastName}`}
                              width={112}
                              height={112}
                              className="rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <span className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gray-300 text-2xl font-bold text-gray-600 border-4 border-white shadow-lg">
                              {getPlayerInitials(currentPlayer.player.firstName, currentPlayer.player.lastName)}
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {currentPlayer.player.firstName} {currentPlayer.player.lastName}
                          </h2>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg text-gray-600">#{currentPlayer.player.jerseyNumber ?? '–'}</span>
                            <span className="text-gray-400">–</span>
                            {renderPositionBadge(currentPlayer.playerPosition.key)}
                          </div>

                          {/* Team */}
                          {teamName && (
                            <div className="mt-3 flex items-center gap-2">
                              {teamLogoUrl && (
                                <Image
                                  src={teamLogoUrl}
                                  alt={teamName}
                                  width={20}
                                  height={20}
                                  className="rounded object-contain"
                                />
                              )}
                              <span className="text-sm text-gray-700">{teamName}</span>
                            </div>
                          )}

                          {/* Personal Data */}
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">Geburtsdatum:</span>{' '}
                            <span className="text-gray-900">
                              {isLoading ? '…' : formatBirthDate(playerDetails?.birthDate)}
                            </span>
                          </div>

                          {/* Full Face Requirement Badge */}
                          {!isLoading && (
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
                          )}
                        </div>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="p-8 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <>
                        {/* Lizenzen Block */}
                        <div className="p-6 border-b">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Lizenzen</h3>

                          {playerDetails?.assignedTeams && playerDetails.assignedTeams.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-2 pr-3 w-4"></th>
                                    <th className="pb-2 pr-4">Team</th>
                                    <th className="pb-2 pr-4">Typ</th>
                                    <th className="pb-2 pr-4">Quelle</th>
                                    <th className="pb-2">Pass-Nr.</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {playerDetails.assignedTeams.map((assignment, idx) => (
                                    <tr key={idx} className="text-sm">
                                      <td className="py-2 pr-3">
                                        <span
                                          className={`inline-block w-2.5 h-2.5 rounded-full ${getLicenceStatusColor(assignment.status)}`}
                                          title={assignment.status ?? ''}
                                        ></span>
                                      </td>
                                      <td className="py-2 pr-4 text-gray-900">
                                        {assignment.team?.fullName || assignment.team?.name || '–'}
                                      </td>
                                      <td className="py-2 pr-4">
                                        {assignment.licenceType ? (
                                          <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            {assignment.licenceType}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">–</span>
                                        )}
                                      </td>
                                      <td className="py-2 pr-4">
                                        {assignment.source ? (
                                          <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                            {assignment.source}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">–</span>
                                        )}
                                      </td>
                                      <td className="py-2">
                                        {(assignment.passNumber || currentPlayer.passNumber) ? (
                                          <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                            {assignment.passNumber || currentPlayer.passNumber}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">–</span>
                                        )}
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
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Statistiken</h3>

                          {playerDetails?.stats && playerDetails.stats.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-2 pr-4">Saison</th>
                                    <th className="pb-2 pr-4">Turnier</th>
                                    <th className="pb-2 pr-4">Team</th>
                                    <th className="pb-2 pr-3 text-center w-10">Sp</th>
                                    <th className="pb-2 pr-3 text-center w-10">T</th>
                                    <th className="pb-2 pr-3 text-center w-10">V</th>
                                    <th className="pb-2 text-center w-10">P</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {playerDetails.stats.map((stat, idx) => (
                                    <tr key={idx} className="text-gray-700">
                                      <td className="py-2 pr-4 text-gray-500 text-xs">{stat.season?.name || stat.season?.alias || '–'}</td>
                                      <td className="py-2 pr-4">{stat.tournament?.name || stat.tournament?.alias || '–'}</td>
                                      <td className="py-2 pr-4">{stat.team?.name || '–'}</td>
                                      <td className="py-2 pr-3 text-center font-medium">{stat.gamesPlayed ?? 0}</td>
                                      <td className="py-2 pr-3 text-center font-medium">{stat.goals ?? 0}</td>
                                      <td className="py-2 pr-3 text-center font-medium">{stat.assists ?? 0}</td>
                                      <td className="py-2 text-center font-medium">{stat.points ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Keine Statistikdaten verfügbar.</p>
                          )}
                        </div>
                      </>
                    )}

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
