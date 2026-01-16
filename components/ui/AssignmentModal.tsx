import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import TeamAssignmentSelect from './TeamAssignmentSelect';
import { Assignment, AssignmentTeam } from '../../types/PlayerValues';

interface PossibleTeam {
  teamId: string;
  teamName: string;
  teamAlias: string;
  teamAgeGroup: string;
  recommendedType: string;
  status: string;
  clubId: string;
  clubName: string;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAssignedTeams: Assignment[]) => Promise<void>;
  playerId: string;
  clubId: string;
  clubName: string;
  currentAssignments: Assignment[];
  editingTeam?: AssignmentTeam | null;
  editingClubId?: string | null;
  managedByISHD?: boolean;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerId,
  clubId,
  clubName,
  currentAssignments = [],
  editingTeam = null,
  editingClubId = null,
  managedByISHD = false,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<PossibleTeam | null>(null);
  const [jerseyNo, setJerseyNo] = useState<string>('');
  const [active, setActive] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingTeam;

  useEffect(() => {
    if (isOpen) {
      if (editingTeam) {
        setJerseyNo(editingTeam.jerseyNo?.toString() || '');
        setActive(editingTeam.active || false);
        setSelectedTeam({
          teamId: editingTeam.teamId,
          teamName: editingTeam.teamName,
          teamAlias: editingTeam.teamAlias,
          teamAgeGroup: editingTeam.teamAgeGroup,
          recommendedType: editingTeam.licenseType,
          status: editingTeam.status,
          clubId: editingClubId || clubId,
          clubName: clubName,
        });
      } else {
        setSelectedTeam(null);
        setJerseyNo('');
        setActive(false);
      }
      setError(null);
    }
  }, [isOpen, editingTeam, editingClubId, clubId, clubName]);

  const handleCancel = () => {
    setSelectedTeam(null);
    setJerseyNo('');
    setActive(false);
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (!selectedTeam && !isEditMode) {
      setError('Bitte wähle eine Mannschaft aus.');
      return;
    }

    const jerseyNumber = jerseyNo.trim() !== '' ? parseInt(jerseyNo, 10) : undefined;
    if (jerseyNumber !== undefined && (isNaN(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
      setError('Trikotnummer muss zwischen 1 und 99 liegen.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let updatedAssignments = [...currentAssignments];

      if (isEditMode && editingTeam) {
        const teamChanged = selectedTeam && selectedTeam.teamId !== editingTeam.teamId;
        updatedAssignments = updatedAssignments.map((assignment) => {
          if (assignment.clubId === (editingClubId || clubId)) {
            return {
              ...assignment,
              teams: assignment.teams.map((team) => {
                if (team.teamId === editingTeam.teamId) {
                  if (teamChanged && selectedTeam) {
                    return {
                      ...team,
                      teamId: selectedTeam.teamId,
                      teamName: selectedTeam.teamName,
                      teamAlias: selectedTeam.teamAlias,
                      teamAgeGroup: selectedTeam.teamAgeGroup,
                      licenseType: selectedTeam.recommendedType,
                      jerseyNo: jerseyNumber,
                      active: active,
                      modifyDate: new Date().toISOString(),
                    };
                  }
                  return {
                    ...team,
                    jerseyNo: jerseyNumber,
                    active: active,
                    modifyDate: new Date().toISOString(),
                  };
                }
                return team;
              }),
            };
          }
          return assignment;
        });
      } else if (selectedTeam) {
        const newTeamAssignment: AssignmentTeam = {
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          teamAlias: selectedTeam.teamAlias,
          teamType: '',
          teamAgeGroup: selectedTeam.teamAgeGroup,
          passNo: '',
          licenseType: selectedTeam.recommendedType,
          status: 'PENDING',
          invalidReasonCodes: [],
          adminOverride: false,
          overrideReason: '',
          overrideDate: '',
          validFrom: new Date().toISOString(),
          validTo: '',
          source: 'BISHL',
          modifyDate: new Date().toISOString(),
          active: active,
          jerseyNo: jerseyNumber,
        };

        const existingClubIndex = updatedAssignments.findIndex(
          (assignment) => assignment.clubId === clubId
        );

        if (existingClubIndex === -1) {
          updatedAssignments.push({
            clubId: clubId,
            clubName: clubName,
            clubAlias: '',
            clubIshdId: '',
            clubType: '',
            teams: [newTeamAssignment],
          });
        } else {
          updatedAssignments[existingClubIndex] = {
            ...updatedAssignments[existingClubIndex],
            teams: [...updatedAssignments[existingClubIndex].teams, newTeamAssignment],
          };
        }
      }

      await onSave(updatedAssignments);
      handleCancel();
    } catch (err) {
      console.error('Error saving assignment:', err);
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const isFormComplete = isEditMode || selectedTeam !== null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={handleCancel}>
        <div className="fixed inset-0 bg-black/30 transition-opacity" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                <Dialog.Title as="h3" className="text-lg text-center font-bold leading-6 text-gray-900 mb-4">
                  {isEditMode ? 'Pass bearbeiten' : 'Neuer Spielerpass'}
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <TeamAssignmentSelect
                    playerId={playerId}
                    clubId={clubId}
                    selectedTeamId={selectedTeam?.teamId || null}
                    onTeamChange={setSelectedTeam}
                    label="Mannschaft"
                    managedByISHD={managedByISHD}
                    licenceType={editingTeam?.licenseType}
                    licenceSource={editingTeam?.source}
                  />

                  <div>
                    <label htmlFor="jerseyNo" className="block text-sm font-medium leading-6 text-gray-900">
                      Trikotnummer
                    </label>
                    <input
                      type="number"
                      name="jerseyNo"
                      id="jerseyNo"
                      min="1"
                      max="99"
                      value={jerseyNo}
                      onChange={(e) => setJerseyNo(e.target.value)}
                      autoComplete="off"
                      className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none [-webkit-appearance:textfield] [-moz-appearance:textfield]"
                      placeholder="1-99"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="active" className="block text-sm font-medium leading-6 text-gray-900">
                      Aktiv
                    </label>
                    <Switch
                      checked={active}
                      onChange={setActive}
                      className={`${active ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${active ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </div>
                </div>

                <div className="mt-6 flex justify-end items-center space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isFormComplete && !saving
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-indigo-300 cursor-not-allowed'
                    }`}
                    onClick={handleSave}
                    disabled={!isFormComplete || saving}
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AssignmentModal;
