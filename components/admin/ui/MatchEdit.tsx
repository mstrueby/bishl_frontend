import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Match } from '../../../types/MatchValues';
import axios from 'axios';
import VenueSelect from '../../ui/VenueSelect';
import { VenueValues } from '../../../types/VenueValues';

interface EditMatchData {
  venue: { _id: string; name: string; alias: string };
  startDate: string;
}

interface MatchEditProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  jwt: string;
  onSuccess: () => void;
}

const MatchEdit = ({ isOpen, onClose, match, jwt, onSuccess }: MatchEditProps) => {
  const [venues, setVenues] = useState<VenueValues[]>([]);
  const [editData, setEditData] = useState<EditMatchData>({
    venue: { _id: match.venue.venueId, name: match.venue.name, alias: match.venue.alias },
    startDate: new Date(match.startDate).toISOString().slice(0, 16),
  });

  useEffect(() => {
    console.log("fetch venues")
    const fetchVenues = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/?active=true`);
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

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`, {
        startDate: new Date(formData.get('startDate') as string),
        venue: {
          _id: editData.venue._id,
          name: editData.venue.name,
          alias: match.venue.alias
        }
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating match:', error);
    }
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Spielansetzung bearbeiten
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Datum und Zeit
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      defaultValue={new Date(match.startDate).toISOString().slice(0, 16)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <VenueSelect
                      selectedVenueId={match.venue.venueId}
                      venues={venues}
                      onVenueChange={(venueId) => {
                        const selectedVenue = venues.find(v => v._id === venueId);
                        if (selectedVenue) {
                          setEditData({
                            ...editData,
                            venue: { _id: venueId, name: selectedVenue.name, alias: selectedVenue.alias }
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