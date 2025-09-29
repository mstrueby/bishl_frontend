
import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import EventPlayerSelect from './EventPlayerSelect';
import InputMatchTime from './form/InputMatchTime';
import { RosterPlayer, EventPlayer, ScoresBase } from '../../types/MatchValues';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

interface GoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamFlag: 'home' | 'away';
  roster: RosterPlayer[];
  jwt: string;
  onSuccess: () => void;
  editGoal?: ScoresBase;
}

const validationSchema = Yup.object().shape({
  matchTime: Yup.string()
    .required('Zeit ist erforderlich')
    .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein')
    .test('valid-seconds', 'Sekunden müssen zwischen 00-59 sein', function(value) {
      if (!value || !value.includes(':')) return false;
      const [minutes, seconds] = value.split(':');
      const secondsNum = parseInt(seconds, 10);
      return secondsNum >= 0 && secondsNum <= 59;
    }),
  goalPlayer: Yup.object().shape({
    playerId: Yup.string().required('Spieler ist erforderlich'),
    firstName: Yup.string().required(),
    lastName: Yup.string().required(),
    jerseyNumber: Yup.number().required()
  }).required('Torschütze ist erforderlich'),
  assistPlayer: Yup.object().nullable(), // Optional
  isPPG: Yup.boolean(),
  isSHG: Yup.boolean(),
  isGWG: Yup.boolean()
});

const GoalDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess, editGoal }: GoalDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Clear error when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (values: ScoresBase) => {
    setIsSubmitting(true);
    setError('');

    try {
      const goalData = {
        matchTime: values.matchTime,
        goalPlayer: values.goalPlayer,
        assistPlayer: values.assistPlayer || undefined,
        isPPG: values.isPPG || false,
        isSHG: values.isSHG || false,
        isGWG: values.isGWG || false
      };

      if (editGoal && editGoal._id) {
        // Update existing goal
        const response = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/scores/${editGoal._id}`,
          goalData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`
            }
          }
        );
        if (response.status === 200 || response.status === 304) {
          console.log('Edit successful, closing dialog and refreshing data');
        }
      } else {
        // Create new goal
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/scores/`,
          goalData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`
            }
          }
        );
        if (response.status === 201) {
          console.log('Create goal successful, closing dialog and refreshing data');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
        setError('Fehler beim Speichern des Tors');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg text-center font-bold leading-6 text-gray-900 mb-4"
                >
                  {editGoal ? 'Tor bearbeiten' : 'Tor hinzufügen'}
                </Dialog.Title>

                <Formik
                  key={editGoal?._id || 'new'}
                  initialValues={{
                    matchTime: editGoal?.matchTime || '',
                    goalPlayer: editGoal?.goalPlayer ? {
                      playerId: editGoal.goalPlayer.playerId,
                      firstName: editGoal.goalPlayer.firstName,
                      lastName: editGoal.goalPlayer.lastName,
                      jerseyNumber: editGoal.goalPlayer.jerseyNumber
                    } : null,
                    assistPlayer: editGoal?.assistPlayer ? {
                      playerId: editGoal.assistPlayer.playerId,
                      firstName: editGoal.assistPlayer.firstName,
                      lastName: editGoal.assistPlayer.lastName,
                      jerseyNumber: editGoal.assistPlayer.jerseyNumber
                    } : null,
                    isPPG: editGoal?.isPPG || false,
                    isSHG: editGoal?.isSHG || false,
                    isGWG: editGoal?.isGWG || false,
                  }}
                  validationSchema={validationSchema}
                  enableReinitialize={true}
                  onSubmit={(values, { setSubmitting }) => {
                    if (values.goalPlayer) {
                      handleSubmit(values as ScoresBase);
                    } else {
                      setError('Torschütze ist erforderlich');
                    }
                    setSubmitting(false);
                  }}
                >
                  {({ setFieldValue, values }) => (
                    <Form>
                      {/* Match Time */}
                      <div>
                        <InputMatchTime
                          name="matchTime"
                          label="Spielzeit"
                          tabIndex={1}
                        />
                      </div>

                      {/* Goal Player Selection */}
                      <EventPlayerSelect
                        name="goalPlayer"
                        selectedPlayer={values.goalPlayer || null}
                        onChange={(eventPlayer) => {
                          setFieldValue('goalPlayer', eventPlayer);
                          if (eventPlayer) {
                            setError('');
                          }
                        }}
                        roster={roster}
                        label="Torschütze"
                        required={true}
                        placeholder="Spieler auswählen"
                        showErrorText={false}
                        tabIndex={2}
                      />

                      {/* Assist Player Selection */}
                      <EventPlayerSelect
                        name="assistPlayer"
                        selectedPlayer={values.assistPlayer || null}
                        onChange={(eventPlayer) => {
                          setFieldValue('assistPlayer', eventPlayer);
                        }}
                        roster={roster}
                        label="Vorlage (optional)"
                        required={false}
                        placeholder="Spieler auswählen"
                        removeButton={true}
                        showErrorText={false}
                        tabIndex={3}
                      />

                      {error && (
                        <div className="text-red-600 text-sm mt-2">
                          {error}
                        </div>
                      )}

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          tabIndex={4}
                          className="w-28 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                            </svg>
                          ) : (
                            'Speichern'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          tabIndex={5}
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default GoalDialog;
