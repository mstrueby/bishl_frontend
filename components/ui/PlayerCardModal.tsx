import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { RosterPlayer } from '../../types/MatchValues';
import { PlayerDetails } from '../../types/PlayerDetails';
import { AssignmentTeam } from '../../types/PlayerValues';
import apiClient from '../../lib/apiClient';
import { getErrorMessage } from '../../lib/errorHandler';
import { getLicenceTypeBadgeClass } from '../../lib/constants';

const CURRENT_SEASON = process.env.NEXT_PUBLIC_CURRENT_SEASON;

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

const getPlayerInitials = (firstName: string, lastName: string): string =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

const renderLicenceStatusBadge = (status: string | undefined) => {
  if (status === 'INVALID') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
        Ungültig
      </span>
    );
  }

  if (status === 'VALID') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
        Gültig
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
      Unbekannt
    </span>
  );
};

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
                      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
                        {/* Avatar */}
                        <div className="sm:col-span-4 flex justify-center">
                          {currentPlayer.player.imageUrl ? (
                            <Image
                              src={currentPlayer.player.imageUrl}
                              alt={`${currentPlayer.player.firstName} ${currentPlayer.player.lastName}`}
                              width={176}
                              height={176}
                              className="h-40 w-40 sm:h-44 sm:w-44 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <span className="inline-flex h-40 w-40 sm:h-44 sm:w-44 items-center justify-center rounded-full bg-gray-300 text-4xl font-bold text-gray-600 border-4 border-white shadow-lg">
                              {getPlayerInitials(currentPlayer.player.firstName, currentPlayer.player.lastName)}
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="sm:col-span-8 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-1.5">
                              <span
                                className="w-4 flex-shrink-0 pt-1.5 text-center text-sm text-gray-500"
                                title={positionTooltips[currentPlayer.playerPosition.key] || currentPlayer.playerPosition.key}
                              >
                                {currentPlayer.playerPosition.key}
                              </span>
                              <span className="flex-shrink-0 pt-0.5 text-lg font-semibold tabular-nums text-gray-700">
                                #{currentPlayer.player.jerseyNumber ?? '–'}
                              </span>
                              <div className="min-w-0">
                                <h2 className="text-2xl font-bold leading-tight text-gray-900">
                                  {currentPlayer.player.firstName} {currentPlayer.player.lastName}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                  {isLoading ? '…' : formatBirthDate(playerDetails?.birthdate)}
                                </p>
                              </div>
                            </div>

                            {teamLogoUrl && (
                              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
                                <Image
                                  src={teamLogoUrl}
                                  alt={teamName ? `${teamName} Logo` : 'Teamlogo'}
                                  width={56}
                                  height={56}
                                  className="h-14 w-14 object-contain"
                                />
                              </div>
                            )}
                          </div>

                          {/* Full Face Requirement Badge */}
                          {!isLoading && (
                            <div className="mt-4">
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

                          {(() => {
                            const flatTeams: (AssignmentTeam & { clubName: string })[] =
                              (playerDetails?.assignedTeams ?? []).flatMap((a) =>
                                (a.teams ?? []).map((t) => ({ ...t, clubName: a.clubName }))
                              );
                            return flatTeams.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                      <th className="pb-2 pr-4">Team</th>
                                      <th className="pb-2 pr-4">Typ</th>
                                      <th className="pb-2 pr-4">Quelle</th>
                                      <th className="pb-2 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {flatTeams.map((t, idx) => (
                                      <tr key={idx} className="text-sm">
                                        <td className="py-2 pr-4 text-gray-900">
                                          {t.teamName || '–'}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {t.licenseType ? (
                                            <span className={getLicenceTypeBadgeClass(t.licenseType)}>
                                              {t.licenseType}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">–</span>
                                          )}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {t.source ? (
                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                              {t.source}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">–</span>
                                          )}
                                        </td>
                                        <td className="py-2 text-right">
                                          {renderLicenceStatusBadge(t.status)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Keine Lizenzdaten verfügbar.</p>
                            );
                          })()}
                        </div>

                        {/* Statistiken Block */}
                        <div className="p-6 border-b">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">Statistiken</h3>

                          {(() => {
                            const allStats = playerDetails?.stats ?? [];
                            const currentStats = CURRENT_SEASON
                              ? allStats.filter((s) => s.season?.alias === CURRENT_SEASON)
                              : allStats;
                            return currentStats.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                      <th className="pb-2 pr-4">Wettbewerb</th>
                                      <th className="pb-2 pr-4">Team</th>
                                      <th className="pb-2 pr-3 text-center w-10">Sp</th>
                                      <th className="pb-2 pr-3 text-center w-10">T</th>
                                      <th className="pb-2 pr-3 text-center w-10">V</th>
                                      <th className="pb-2 text-center w-10">P</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {currentStats.map((stat, idx) => (
                                      <tr key={idx} className="text-gray-700">
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
                            );
                          })()}
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
