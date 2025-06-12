import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import PlayerSelect from './PlayerSelect';
import InputMatchTime from './form/InputMatchTime';
import { RosterPlayer, PenaltiesBase } from '../../types/MatchValues';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

interface PenaltyCode {
  key: string;
  value: string;
}

interface PenaltyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamFlag: 'home' | 'away';
  roster: RosterPlayer[];
  jwt: string;
  onSuccess: () => void;
  editPenalty?: PenaltiesBase; // Penalty object to edit
}

const validationSchema = Yup.object().shape({
  matchTimeStart: Yup.string()
    .required('Zeit ist erforderlich')
    .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein'),
  matchTimeEnd: Yup.string()
    .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein')
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
  penaltyMinutes: Yup.number().required('Strafminuten sind erforderlich'),
  isGM: Yup.boolean(),
});

const PenaltyDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess, editPenalty }: PenaltyDialogProps) => {
  const [matchTimeStart, setMatchTimeStart] = useState('');
  const [matchTimeEnd, setMatchTimeEnd] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PenaltyPlayer | null>(null);
  const [selectedPenaltyCode, setSelectedPenaltyCode] = useState<PenaltyCode | null>(null);
  const [penaltyMinutes, setPenaltyMinutes] = useState<number>(2);
  const [isGM, setIsGM] = useState(false);
  const [isMP, setIsMP] = useState(false);
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [penaltyPlayerError, setPenaltyPlayerError] = useState(false);
  const penaltyMinuteOptions = [2, 5, 10, 20];

  const resetForm = () => {
    setMatchTimeStart('');
    setMatchTimeEnd('');
    setSelectedPlayer(null);
    setSelectedPenaltyCode(null);
    setPenaltyMinutes(2);
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
  fetchPenaltyCodes();

  // fill the form with the penalty data when editing
  useEffect(() => {
    if (isOpen && editPenalty) {
      // find and set penalty player
      const editPenaltyPlayer = editPenalty.penaltyPlayer ? roster.find(item => item.player.playerId === editPenalty.penaltyPlayer.playerId) || null : null;
      setSelectedPlayer(editPenaltyPlayer);

      setIsGM(editPenalty.isGM || false);
      setIsMP(editPenalty.isMP || false);
    } else if (isOpen && !editPenalty) {
      // Reset form if not editing
      resetForm();
    }
    setError('');
    setPenaltyPlayerError(false);

    if (editPenalty) {
      // Fill form with data from the penalty to edit
      setMatchTimeStart(editPenalty.matchTimeStart || '');
      setMatchTimeEnd(editPenalty.matchTimeEnd || '');

      // Set selected player
      if (editPenalty.penaltyPlayer) {
        setSelectedPlayer({
          playerId: editPenalty.penaltyPlayer.playerId,
          firstName: editPenalty.penaltyPlayer.firstName,
          lastName: editPenalty.penaltyPlayer.lastName,
          jerseyNumber: editPenalty.penaltyPlayer.jerseyNumber
        });
      }

      // Set penalty code
      if (editPenalty.penaltyCode) {
        setSelectedPenaltyCode(editPenalty.penaltyCode);
      }

      // Set penalty minutes
      if (editPenalty.penaltyMinutes) {
        setPenaltyMinutes(editPenalty.penaltyMinutes);
      }

      // Set isGM and isMP
      setIsGM(editPenalty.isGM || false);
      setIsMP(editPenalty.isMP || false);
    } else {
      resetForm();
    }
  }, [isOpen, editPenalty, roster]);

  // save dialog
  const handleSubmit = async () => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setPenaltyPlayerError(false);

    if (!selectedPlayer || !selectedPenaltyCode || !matchTimeStart) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus.');
      setPenaltyPlayerError(!selectedPlayer);
      setIsSubmitting(false);
      return;
    }

    try {
      const penaltyData = {
        matchTimeStart,
        matchTimeEnd: matchTimeEnd || undefined, // Only include if it has a value
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
        penaltyMinutes,
        isGM,
        isMP
      };
      console.log('Penalty data:', penaltyData);

      if (editPenalty && editPenalty._id) {
        // Update existing penalty
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
        // Close and refresh on any successful response (2xx)
        if (response.status === 200 || response.status === 304) {
          console.log('Edit successful, closing dialog and refreshing data');
        } else {
          console.warn('Edit response not in 200 or 304:', response.status, response.data);
        }
      } else {
        // Create new penalty
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
        // Log response for debugging
        if (response.status === 201) {
          console.log('Create penalty successful, closing dialog and refreshing data');
        } else {
          console.warn('Create penalty response not 201:', response.status, response.data);
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

  const initialValues = {
    matchTimeStart: '',
    matchTimeEnd: '',
    penaltyPlayer: null,
    penaltyCode: null,
    penaltyMinutes: 2,
    isGM: false,
    isMP: false,
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
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  enableReinitialize={true}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, setFieldValue, }) => (
                    <Form className="mt-4 space-y-4">
                      {/* Match Time - Start */}
                      <InputMatchTime
                        name="matchTimeStart"
                        label="Start (mi: ss)"
                      />
                      {/* Match Time - End (Optional) */}
                      <InputMatchTime
                        name="matchTimeEnd"
                        label="Ende (mi: ss)"
                      />
                      {/* Player Selection */}
                      <PlayerSelect
                        selectedPlayer={selectedPlayer}
                        onChange={(player) => {
                          setSelectedPlayer(player);
                          if (player) {
                            setPenaltyPlayerError(false);
                            setError('');
                          }
                        }}
                        roster={roster}
                        label="Spieler"
                        required={true}
                        placeholder="Spieler auswählen"
                        error={penaltyPlayerError}
                      <div>
                        <label htmlFor="player" className="block text-sm font-medium text-gray-700">
                          Spieler
                        </label>
                        <select
                          id="player"
                          name="player"
                          value={selectedPlayer?.playerId || ''}
                          onChange={(e) => {
                            const playerId = e.target.value;
                            const player = roster.find((p) => p.player.playerId === playerId);
                            if (player) {
                              setSelectedPlayer({
                                playerId: player.player.playerId,
                                firstName: player.player.firstName,
                                lastName: player.player.lastName,
                                jerseyNumber: player.player.jerseyNumber
                              });
                            }
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Spieler auswählen</option>
                          {roster?.map((player) => (
                            <option key={player.player.playerId} value={player.player.playerId}>
                              #{player.player.jerseyNumber} {player.player.firstName} {player.player.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Penalty Code Selection */}
                      <div>
                        <label htmlFor="penaltyCode" className="block text-sm font-medium text-gray-700">
                          Strafcode
                        </label>
                        <select
                          id="penaltyCode"
                          name="penaltyCode"
                          value={selectedPenaltyCode?.key || ''}
                          onChange={(e) => {
                            const key = e.target.value;
                            const code = penaltyCodes.find(code => code.key === key);
                            if (code) {
                              setSelectedPenaltyCode(code);
                            }
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Strafcode auswählen</option>
                          {Array.isArray(penaltyCodes) && penaltyCodes.map((code) => (
                            <option key={code.key} value={code.key}>
                              {code.key} - {code.value}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Penalty Minutes */}
                      <div>
                        <label htmlFor="penaltyMinutes" className="block text-sm font-medium text-gray-700">
                          Strafminuten
                        </label>
                        <select
                          id="penaltyMinutes"
                          name="penaltyMinutes"
                          value={penaltyMinutes}
                          onChange={(e) => setPenaltyMinutes(parseInt(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          {penaltyMinuteOptions.map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} Minuten
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Penalty Type Checkboxes */}
                      <div className="flex space-x-6">
                        <div className="flex items-center">
                          <input
                            id="isGM"
                            name="isGM"
                            type="checkbox"
                            checked={isGM}
                            onChange={(e) => setIsGM(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="isGM" className="ml-2 block text-sm text-gray-700">
                            Spieldauer (GM)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="isMP"
                            name="isMP"
                            type="checkbox"
                            checked={isMP}
                            onChange={(e) => setIsMP(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="isMP" className="ml-2 block text-sm text-gray-700">
                            Matchstrafe (MP)
                          </label>
                        </div>
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