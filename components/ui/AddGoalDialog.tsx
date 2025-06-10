import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import PlayerSelect from './PlayerSelect';
import { RosterPlayer, EventPlayer } from '../../types/MatchValues';

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamFlag: 'home' | 'away';
  roster: RosterPlayer[];
  jwt: string;
  onSuccess: () => void;
  editGoal?: any;
}

const AddGoalDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess, editGoal }: AddGoalDialogProps) => {
  const [matchTime, setMatchTime] = useState('');
  const [selectedGoalPlayer, setSelectedGoalPlayer] = useState<RosterPlayer | null>(null);
  const [selectedAssistPlayer, setSelectedAssistPlayer] = useState<RosterPlayer | null>(null);
  const [isPPG, setIsPPG] = useState(false);
  const [isSHG, setIsSHG] = useState(false);
  const [isGWG, setIsGWG] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fill the form with the goal data when editing
  useEffect(() => {
    if (isOpen && editGoal) {
      setMatchTime(editGoal.matchTime || '');
      
      // Find and set goal player
      const goalPlayer = editGoal.goalPlayer 
        ? roster.find(item => item.player.playerId === editGoal.goalPlayer.playerId) || null 
        : null;
      setSelectedGoalPlayer(goalPlayer);
      
      // Find and set assist player
      const assistPlayer = editGoal.assistPlayer 
        ? roster.find(item => item.player.playerId === editGoal.assistPlayer.playerId) || null 
        : null;
      setSelectedAssistPlayer(assistPlayer);
      
      setIsPPG(editGoal.isPPG || false);
      setIsSHG(editGoal.isSHG || false);
      setIsGWG(editGoal.isGWG || false);
    } else if (isOpen && !editGoal) {
      // Reset form when opening for a new goal
      setMatchTime('');
      setSelectedGoalPlayer(null);
      setSelectedAssistPlayer(null);
      setIsPPG(false);
      setIsSHG(false);
      setIsGWG(false);
    }
  }, [isOpen, editGoal, roster]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!matchTime) {
      setError('Bitte Spielzeit eingeben');
      return;
    }

    if (!selectedGoalPlayer) {
      setError('Bitte Torschütze auswählen');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const goalData = {
        matchTime,
        goalPlayer: selectedGoalPlayer.player,
        assistPlayer: selectedAssistPlayer ? selectedAssistPlayer.player : undefined,
        isPPG,
        isSHG,
        isGWG
      };

      console.log('Goal Data:', goalData)
      if (editGoal && editGoal._id) {
        // Update existing goal
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/scores/${editGoal._id}`,
          goalData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`
            }
          }
        );
      } else {
        // Create new goal
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/scores/`, 
          goalData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`
            }
          }
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Fehler beim Speichern des Tors');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMatchTime('');
    setSelectedGoalPlayer(null);
    setSelectedAssistPlayer(null);
    setIsPPG(false);
    setIsSHG(false);
    setIsGWG(false);
    setError('');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={() => {
        resetForm();
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
                  {editGoal ? 'Tor bearbeiten' : 'Tor hinzufügen'}
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spielzeit (mm:ss)
                    </label>
                    <input
                      type="text"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>

                  <div>
                    <PlayerSelect
                      selectedPlayer={selectedGoalPlayer}
                      onChange={setSelectedGoalPlayer}
                      roster={roster}
                      label="Torschütze"
                      required={true}
                      placeholder="Spieler auswählen"
                    />
                  </div>

                  <div>
                    <PlayerSelect
                      selectedPlayer={selectedAssistPlayer}
                      onChange={setSelectedAssistPlayer}
                      roster={roster}
                      label="Vorlage (optional)"
                      required={false}
                      placeholder="Spieler auswählen"
                      removeButton={true}
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        onClose();
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                          </svg>
                          Speichern
                        </>
                      ) : (
                        'Speichern'
                      )}
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

export default AddGoalDialog;