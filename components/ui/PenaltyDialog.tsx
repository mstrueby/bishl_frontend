import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import PlayerSelect from './PlayerSelect';
import PenaltyCodeSelect from './PenaltyCodeSelect';
import InputMatchTime from './form/InputMatchTime';
import Listbox from './form/Listbox';
import Toggle from './form/Toggle';
import { RosterPlayer, PenaltiesBase } from '../../types/MatchValues';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

interface PenaltyCode {
  key: string;
  value: string;
}

interface PenaltyPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

interface PenaltyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamFlag: 'home' | 'away';
  roster: RosterPlayer[];
  jwt: string;
  onSuccess: () => void;
  editPenalty?: PenaltiesBase;
}

const validationSchema = Yup.object().shape({
  matchTimeStart: Yup.string()
    .required('Zeit ist erforderlich')
    .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein'),
  matchTimeEnd: Yup.string()
    .matches(/^(\d{1,3}:\d{2})?$/, 'Zeit muss im Format MM:SS sein oder leer bleiben')
    .nullable(),
  penaltyPlayer: Yup.object().shape({
    playerId: Yup.string().required('Spieler ist erforderlich'),
    firstName: Yup.string().required(),
    lastName: Yup.string().required(),
    jerseyNumber: Yup.number().required()
  }).nullable(),
  penaltyCode: Yup.object().shape({
    key: Yup.string().required('Strafcode ist erforderlich'),
    value: Yup.string().required()
  }).nullable(),
  penaltyMinutes: Yup.string().required('Strafminuten sind erforderlich'),
  isGM: Yup.boolean(),
  isMP: Yup.boolean(),
});

const PenaltyDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess, editPenalty }: PenaltyDialogProps) => {
  const [matchTimeStart, setMatchTimeStart] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PenaltyPlayer | null>(null);
  const [selectedPenaltyCode, setSelectedPenaltyCode] = useState<PenaltyCode | null>(null);
  const [isGM, setIsGM] = useState(false);
  const [isMP, setIsMP] = useState(false);
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [penaltyPlayerError, setPenaltyPlayerError] = useState(false);

  const penaltyMinuteOptions = [
    { key: '2', value: '2 Minuten' },
    { key: '5', value: '5 Minuten' },
    { key: '10', value: '10 Minuten' },
    { key: '20', value: '20 Minuten' }
  ];

  const resetForm = () => {
    setMatchTimeStart('');
    setSelectedPlayer(null);
    setSelectedPenaltyCode(null);
    setIsGM(false);
    setIsMP(false);
    setPenaltyPlayerError(false);
  };

  // Fetch penalty codes from API
  const fetchPenaltyCodes = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/configs/penaltycode`);
      const data = response.data.value;
      if (Array.isArray(data) && data.length > 0) {
        setPenaltyCodes(data);

        if (!editPenalty) {
          setSelectedPenaltyCode(data[0]);
        }
      } else {
        console.error('Invalid penalty codes data format:', data);
        setPenaltyCodes([]);
      }
    } catch (error) {
      console.error('Error fetching penalty codes:', error);
      setPenaltyCodes([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPenaltyCodes();
    }
  }, [isOpen]);

  // fill the form with the penalty data when editing
  useEffect(() => {
    if (isOpen && editPenalty) {
      // find and set penalty player
      const editPenaltyPlayer = editPenalty.penaltyPlayer ? roster.find(item => item.player.playerId === editPenalty.penaltyPlayer.playerId) || null : null;

      if (editPenaltyPlayer) {
        setSelectedPlayer({
          playerId: editPenaltyPlayer.player.playerId,
          firstName: editPenaltyPlayer.player.firstName,
          lastName: editPenaltyPlayer.player.lastName,
          jerseyNumber: editPenaltyPlayer.player.jerseyNumber
        });
      }

      setMatchTimeStart(editPenalty.matchTimeStart || '');
      setIsGM(editPenalty.isGM || false);
      setIsMP(editPenalty.isMP || false);

      if (editPenalty.penaltyCode) {
        setSelectedPenaltyCode(editPenalty.penaltyCode);
      }
    } else if (isOpen && !editPenalty) {
      resetForm();
    }
    setError('');
    setPenaltyPlayerError(false);
  }, [isOpen, editPenalty, roster]);

  // save dialog
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setError('');
    setPenaltyPlayerError(false);

    if (!selectedPlayer || !selectedPenaltyCode || !values.matchTimeStart) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus.');
      setPenaltyPlayerError(!selectedPlayer);
      setIsSubmitting(false);
      return;
    }

    try {
      const penaltyData = {
        matchTimeStart: values.matchTimeStart,
        matchTimeEnd: values.matchTimeEnd || undefined,
        penaltyPlayer: {
          playerId: selectedPlayer.playerId,
          firstName: selectedPlayer.firstName,
          lastName: selectedPlayer.lastName,
          jerseyNumber: selectedPlayer.jerseyNumber
        },
        penaltyCode: {
          key: selectedPenaltyCode.key,
          value: selectedPenaltyCode.value
        },
        penaltyMinutes: parseInt(values.penaltyMinutes),
        isGM: values.isGM,
        isMP: values.isMP
      };

      if (editPenalty && editPenalty._id) {
        const response = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/penalties/${editPenalty._id}`,
          penaltyData,
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
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/penalties/`,
          penaltyData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt}`
            }
          }
        );
        if (response.status === 201) {
          console.log('Create penalty successful, closing dialog and refreshing data');
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving penalty:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg text-center font-bold leading-6 text-gray-900 mb-4"
                >
                  {editPenalty ? 'Strafe bearbeiten' : 'Strafe hinzufügen'}
                </Dialog.Title>

                <Formik
                  key={editPenalty?._id || 'new'}
                  initialValues={{
                    matchTimeStart: editPenalty?.matchTimeStart || '',
                    matchTimeEnd: editPenalty?.matchTimeEnd || '',
                    penaltyPlayer: selectedPlayer,
                    penaltyCode: selectedPenaltyCode,
                    penaltyMinutes: editPenalty?.penaltyMinutes?.toString() || '2',
                    isGM: editPenalty?.isGM || false,
                    isMP: editPenalty?.isMP || false,
                  }}
                  validationSchema={validationSchema}
                  enableReinitialize={true}
                  onSubmit={(values, { setSubmitting }) => {
                    // Handle form submission with Formik values
                    handleSubmit(values);
                    setSubmitting(false);
                  }}
                >
                  {({ handleSubmit }) => (
                    <Form>
                  {/* Match Time - Start */}
                  <div>
                    <InputMatchTime
                          name="matchTimeStart"
                          label="Start (mi:ss)"
                    />
                  </div>

                  {/* Match Time - End (Optional) */}
                  <div>
                    <InputMatchTime
                      name="matchTimeEnd"
                      label="Ende (mi:ss)"
                    />
                  </div>

                  {/* Player Selection */}
                  <PlayerSelect
                    selectedPlayer={selectedPlayer ? roster.find(p => p.player.playerId === selectedPlayer.playerId) || null : null}
                    onChange={(player) => {
                      if (player) {
                        setSelectedPlayer({
                          playerId: player.player.playerId,
                          firstName: player.player.firstName,
                          lastName: player.player.lastName,
                          jerseyNumber: player.player.jerseyNumber
                        });
                        setPenaltyPlayerError(false);
                        setError('');
                      } else {
                        setSelectedPlayer(null);
                      }
                    }}
                    roster={roster}
                    label="Spieler"
                    required={true}
                    placeholder="Spieler auswählen"
                    error={penaltyPlayerError}
                  />

                  {/* Penalty Code Selection */}
                  <PenaltyCodeSelect
                    selectedPenaltyCode={selectedPenaltyCode}
                    onChange={(penaltyCode) => {
                      setSelectedPenaltyCode(penaltyCode);
                      setError('');
                    }}
                    penaltyCodes={penaltyCodes}
                    label="Strafcode"
                    required={true}
                    placeholder="Strafcode auswählen"
                    error={false}
                  />

                  {/* Penalty Minutes */}
                  <Listbox
                    name="penaltyMinutes"
                    label="Strafminuten"
                    options={penaltyMinuteOptions}
                  />

                  {/* Penalty Type Toggles */}
                  <div className="space-y-2">
                    <Toggle
                      name="isGM"
                      label="Spieldauer (GM)"
                    />
                    <Toggle
                      name="isMP"
                      label="Matchstrafe (MP)"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm mt-2">
                      {error}
                    </div>
                  )}

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

export default PenaltyDialog;