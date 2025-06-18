import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';

interface PenaltyPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

interface PenaltyCode {
  key: string;
  value: string;
}

interface PenaltyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamFlag: string;
  roster: any[];
  jwt: string;
  onSuccess: () => void;
  editPenalty?: any; // Penalty object to edit
}

const AddPenaltyDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess, editPenalty }: PenaltyDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [matchTimeStart, setMatchTimeStart] = useState('');
  const [matchTimeEnd, setMatchTimeEnd] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PenaltyPlayer | null>(null);
  const [selectedPenaltyCode, setSelectedPenaltyCode] = useState<PenaltyCode | null>(null);
  const [penaltyMinutes, setPenaltyMinutes] = useState<number>(2);
  const [isGM, setIsGM] = useState(false);
  const [isMP, setIsMP] = useState(false);
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);
  const penaltyMinuteOptions = [2, 5, 10, 20];

  // Fetch penalty codes from API
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, editPenalty]);

  const resetForm = () => {
    setMatchTimeStart('');
    setMatchTimeEnd('');
    setSelectedPlayer(null);
    setSelectedPenaltyCode(null);
    setPenaltyMinutes(2);
    setIsGM(false);
    setIsMP(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer || !selectedPenaltyCode || !matchTimeStart) {
      return;
    }
    
    // Set a failsafe timeout to close the dialog if needed
    const closeTimeout = setTimeout(() => {
      console.log('Failsafe timeout triggered - forcing dialog close');
      onSuccess();
      onClose();
    }, 5000);

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

    try {
      setIsLoading(true);

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

        // Log response for debugging
        console.log('Edit penalty response:', response.status, response.data);

        // Close and refresh on any successful response (2xx)
        if (response.status >= 200 && response.status < 300) {
          console.log('Edit successful, closing dialog and refreshing data');
          onSuccess();
          onClose();
        } else {
          console.warn('Edit response not in 2xx range:', response.status);
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
        console.log('Create penalty response:', response.status, response.data);

        // Close and refresh on any successful response (2xx)
        if (response.status >= 200 && response.status < 300) {
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving penalty:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', error.response?.data);
      }
    } finally {
      setIsLoading(false);
      clearTimeout(closeTimeout);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="fixed inset-0 bg-black bg-opacity-30"
          >
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                {editPenalty ? 'Strafe bearbeiten' : 'Strafe hinzufügen'}
              </Dialog.Title>
              <form onSubmit={handleSubmit}>
                <div className="mt-4 space-y-4">
                  {/* Match Time - Start */}
                  <div>
                    <label htmlFor="matchTimeStart" className="block text-sm font-medium text-gray-700">
                      Spielzeit Start (mi:ss)
                    </label>
                    <input
                      type="text"
                      id="matchTimeStart"
                      name="matchTimeStart"
                      value={matchTimeStart}
                      onChange={(e) => setMatchTimeStart(e.target.value)}
                      placeholder="z.B. 14:30"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Match Time - End (Optional) */}
                  <div>
                    <label htmlFor="matchTimeEnd" className="block text-sm font-medium text-gray-700">
                      Spielzeit Ende (mi:ss) <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="matchTimeEnd"
                      name="matchTimeEnd"
                      value={matchTimeEnd}
                      onChange={(e) => setMatchTimeEnd(e.target.value)}
                      placeholder="z.B. 16:30"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Player Selection */}
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
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                        </svg>
                        Speichern...
                      </>
                    ) : (
                      'Speichern'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddPenaltyDialog;