import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Match } from '../../../types/MatchValues';
import axios from 'axios';
import { VenueValues } from '../../../types/VenueValues';
import MatchStatusSelect from './MatchStatusSelect';
import { allMatchStatuses } from '../../../tools/consts';

interface EditData {
  matchStatus: { key: string; value: string };
}

interface MatchEditProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  jwt: string;
  onSuccess: (updatedMatch: Partial<Match>) => void;
}

const MatchStatus = ({ isOpen, onClose, match, jwt, onSuccess }: MatchEditProps) => {
  const initialEditData = {
    matchStatus: { key: match.matchStatus.key, value: match.matchStatus.value },
  };
  const [editData, setEditData] = useState<EditData>(initialEditData);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const matchStatus = {
      key: editData.matchStatus.key,
      value: editData.matchStatus.value
    };

    // log values to submit
    console.log('Submitted values:', { matchStatus });

    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`, {
        matchStatus
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        }
      });
      const updatedMatch = response.data;
      onSuccess(updatedMatch);
      onClose();
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[9000]" onClose={() => {
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
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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