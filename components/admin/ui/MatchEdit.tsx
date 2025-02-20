import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Match } from '../../../types/MatchValues';
import axios from 'axios';
import VenueSelect from '../../ui/VenueSelect';
import { VenueValues } from '../../../types/VenueValues';

interface EditMatchData {
  venue: { venueId: string; name: string; alias: string };
  startDate: string;
}

interface MatchEditProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  jwt: string;
  onSuccess: (updatedMatch: Partial<Match>) => void;
  onMatchUpdate?: (updatedMatch: Partial<Match>) => Promise<void>;
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const MatchEdit = ({ isOpen, onClose, match, jwt, onSuccess, onMatchUpdate }: MatchEditProps) => {
  const [venues, setVenues] = useState<VenueValues[]>([]);
  const initialEditData = {
    venue: { venueId: match.venue.venueId, name: match.venue.name, alias: match.venue.alias },
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
  };
  const [editData, setEditData] = useState<EditMatchData>(initialEditData);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch(`${process.env.API_URL}/venues/?active=true`);
        const data = await response.json();
        setVenues(data);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };
    if (isOpen) {
      fetchVenues();
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const startDate = new Date(formData.get('startDate') as string);
    const venue = {
      venueId: editData.venue.venueId,
      name: editData.venue.name,
      alias: match.venue.alias
    };

    // log values to submit
    console.log('Submitted values:', { venue, startDate });

    try {
      const response = await axios.patch(`${process.env.API_URL}/matches/${match._id}`, {
        startDate: formatDate(startDate),
        venue
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
        if (onMatchUpdate) {
          await onMatchUpdate(updatedMatch);
        }
        return updatedMatch;
      } else {
        console.error('Error updating match:', response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        onClose();
      } else {
        console.error('Error updating match:', error);
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
                  Spielansetzung bearbeiten
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                      Datum und Zeit
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      defaultValue={formatDate(match.startDate)}
                      className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                    />
                  </div>
                  <div>
                    <VenueSelect
                      selectedVenueId={editData.venue.venueId}
                      venues={venues}
                      onVenueChange={(venueId) => {
                        const selectedVenue = venues.find(v => v._id === venueId);
                        if (selectedVenue) {
                          setEditData({
                            ...editData,
                            venue: {
                              venueId: venueId,
                              name: selectedVenue.name,
                              alias: selectedVenue.alias
                            }
                          });
                        }
                      }}
                      label="Spielort"
                    />
                  </div>
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

export default MatchEdit;