import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Match } from '../../../types/MatchValues';
import axios from 'axios';
import MatchStatusSelect from './MatchStatusSelect';
import FinishTypeSelect from './FinishTypeSelect';
import { allMatchStatuses, allFinishTypes } from '../../../tools/consts';
import Image from 'next/image';

interface EditData {
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  home: {
    stats: {
      goalsFor: number;
      goalsAgainst: number;
    }
  };
  away: {
    stats: {
      goalsFor: number;
      goalsAgainst: number;
    }
  };
}

interface MatchEditProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  jwt: string;
  onSuccess: (updatedMatch: Partial<Match>) => void;
  onMatchUpdate?: (updatedMatch: Partial<Match>) => Promise<void>;
}

const MatchStatus = ({ isOpen, onClose, match, jwt, onSuccess }: MatchEditProps) => {
  const initialEditData = {
    matchStatus: { key: match.matchStatus.key, value: match.matchStatus.value },
    finishType: { key: match.finishType.key, value: match.finishType.value },
    home: {
      stats: {
        goalsFor: match.home.stats.goalsFor,
        goalsAgainst: match.home.stats.goalsAgainst
      }
    },
    away: {
      stats: {
        goalsFor: match.away.stats.goalsFor,
        goalsAgainst: match.away.stats.goalsAgainst
      }
    }
  };
  const [editData, setEditData] = useState<EditData>(initialEditData);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const matchStatus = {
      key: editData.matchStatus.key,
      value: editData.matchStatus.value
    };
    const finishType = {
      key: editData.finishType.key,
      value: editData.finishType.value
    }

    // log values to submit
    console.log('Submitted values:', {
      matchStatus,
      finishType,
      homeGoals: editData.home.stats.goalsFor,
      awayGoals: editData.away.stats.goalsFor
    });

    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`, {
        matchStatus,
        finishType,
        home: editData.home,
        away: editData.away
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        }
      });
      if (response.status === 200) {
        const updatedMatch = response.data;
        onSuccess(updatedMatch);
        onClose();
        // Call onMatchUpdate callback if provided by parent
        if (onMatchUpdate) {
          onMatchUpdate(updatedMatch);
        }
        return updatedMatch;
      } else {
        console.error('Error updating match:', response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          onClose();
        } else {
          console.error('Error updating match:', error);
        }
      }
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={() => {
        setEditData(initialEditData);
        onClose();
      }}>
        <div className="fixed inset-0 bg-black/30 transition-opacity" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg text-center font-bold leading-6 text-gray-900 mb-4">
                  Ergebnis bearbeiten
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 ">
                  <div className="space-y-6">
                    <MatchStatusSelect
                      selectedStatus={editData.matchStatus}
                      statuses={allMatchStatuses.sort((a, b) => a.sortOrder - b.sortOrder)}
                      onStatusChange={(statusKey) => {
                        const selectedStatus = allMatchStatuses.find(v => v.key === statusKey);
                        if (selectedStatus) {
                          setEditData({
                            ...editData,
                            matchStatus: {
                              key: statusKey,
                              value: selectedStatus.value
                            }
                          });
                        }
                      }}
                    />
                    {editData.matchStatus.key === 'FINISHED' && (
                      <div>
                        <FinishTypeSelect
                          selectedType={editData.finishType}
                          types={allFinishTypes.sort((a, b) => a.sortOrder - b.sortOrder)}
                          onTypeChange={(typeKey) => {
                            const selectedType = allFinishTypes.find(v => v.key === typeKey);
                            if (selectedType) {
                              setEditData({
                                ...editData,
                                finishType: {
                                  key: typeKey,
                                  value: selectedType.value
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                    {(editData.matchStatus.key === 'INPROGRESS' ||
                      editData.matchStatus.key === 'FINISHED' ||
                      editData.matchStatus.key === 'FORFEITED') && (
                        <div className="flex flex-col gap-2 mt-4">
                          <label className="flex-initial block text-sm font-medium text-gray-700">
                            Tore
                          </label>
                          <div className="flex flex-row gap-2 justify-between items-center">
                            <Image className="h-10 w-10 flex-none" src={match.home.logo ? match.home.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.home.tinyName} objectFit="contain" height={40} width={40} />
                            <span className="flex-auto">
                              {match.home.fullName}
                            </span>
                            <input
                              type="number"
                              value={editData.home.stats.goalsFor}
                              onChange={(e) => {
                                const goalsFor = parseInt(e.target.value);
                                setEditData({
                                  ...editData,
                                  home: {
                                    ...editData.home,
                                    stats: { ...editData.home.stats, goalsFor }
                                  },
                                  away: {
                                    ...editData.away,
                                    stats: { ...editData.away.stats, goalsAgainst: goalsFor }
                                  }
                                });
                              }}
                              className="block w-12 text-center rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                            />
                          </div>
                          <div className="flex flex-row gap-2 justify-between items-center">
                            <Image className="h-10 w-10 flex-none" src={match.away.logo ? match.away.logo : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} alt={match.away.tinyName} objectFit="contain" height={40} width={40} />
                            <span className="flex-auto">
                              {match.away.fullName}
                            </span>
                            <input
                              type="number"
                              value={editData.away.stats.goalsFor}
                              onChange={(e) => {
                                const goalsFor = parseInt(e.target.value);
                                setEditData({
                                  ...editData,
                                  away: {
                                    ...editData.away,
                                    stats: { ...editData.away.stats, goalsFor }
                                  },
                                  home: {
                                    ...editData.home,
                                    stats: { ...editData.home.stats, goalsAgainst: goalsFor }
                                  }
                                });
                              }}
                              className="block w-12 text-center rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                            />
                          </div>
                        </div>
                      )}

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MatchStatus;