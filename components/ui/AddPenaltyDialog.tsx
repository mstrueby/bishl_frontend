
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
}

const AddPenaltyDialog = ({ isOpen, onClose, matchId, teamFlag, roster, jwt, onSuccess }: PenaltyDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [matchTimeStart, setMatchTimeStart] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PenaltyPlayer | null>(null);
  const [selectedPenaltyCode, setSelectedPenaltyCode] = useState<PenaltyCode | null>(null);
  const [penaltyMinutes, setPenaltyMinutes] = useState<number>(2);
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);
  const penaltyMinuteOptions = [2, 5, 10, 20];

  // Fetch penalty codes from API
  useEffect(() => {
    if (isOpen) {
      const fetchPenaltyCodes = async () => {
        try {
          const response = await axios.get(`${process.env.API_URL}/configs/penaltycode`);
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            setPenaltyCodes(data);
            setSelectedPenaltyCode(data[0]);
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
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setMatchTimeStart('');
    setSelectedPlayer(null);
    setSelectedPenaltyCode(null);
    setPenaltyMinutes(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer || !selectedPenaltyCode || !matchTimeStart) {
      return;
    }

    const penaltyData = {
      matchTimeStart,
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
      penaltyMinutes
    };

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.API_URL}/matches/${matchId}/${teamFlag}/penalties/`,
        penaltyData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error adding penalty:', error);
    } finally {
      setIsLoading(false);
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
                Strafe hinzufügen
              </Dialog.Title>
              <form onSubmit={handleSubmit}>
                <div className="mt-4 space-y-4">
                  {/* Match Time */}
                  <div>
                    <label htmlFor="matchTime" className="block text-sm font-medium text-gray-700">
                      Spielzeit (mi:ss)
                    </label>
                    <input
                      type="text"
                      id="matchTime"
                      name="matchTime"
                      value={matchTimeStart}
                      onChange={(e) => setMatchTimeStart(e.target.value)}
                      placeholder="z.B. 14:30"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
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
