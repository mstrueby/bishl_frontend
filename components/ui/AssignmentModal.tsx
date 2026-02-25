import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import TeamAssignmentSelect from './TeamAssignmentSelect';
import ClubSelect from './ClubSelect';
import apiClient from '../../lib/apiClient';
import { Assignment, AssignmentTeam, LicenseType, LicenseStatus, Source, ClubType } from '../../types/PlayerValues';
import { TeamType, ClubValues } from '../../types/ClubValues';

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
  isAdmin?: boolean;
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
  isAdmin = false,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<PossibleTeam | null>(null);
  const [selectedLicenseType, setSelectedLicenseType] = useState<string>('');
  const [jerseyNo, setJerseyNo] = useState<string>('');
  const [passNo, setPassNo] = useState<string>('');
  const [active, setActive] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [clubsLoading, setClubsLoading] = useState(false);

  const isEditMode = !!editingTeam;
  const editingAssignment = editingClubId
    ? currentAssignments.find(a => a.clubId === editingClubId)
    : null;
  const effectiveClubName = editingAssignment?.clubName || clubName;

  const teamSelectClubId = isAdmin
    ? (isEditMode ? (editingClubId || clubId) : selectedClubId)
    : clubId;

  useEffect(() => {
    if (isOpen && isAdmin && !isEditMode) {
      const fetchClubs = async () => {
        setClubsLoading(true);
        try {
          const response = await apiClient.get('/clubs');
          setClubs(response.data || []);
        } catch (err) {
          console.error('Error fetching clubs:', err);
          setClubs([]);
        } finally {
          setClubsLoading(false);
        }
      };
      fetchClubs();
    }
  }, [isOpen, isAdmin, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      if (editingTeam) {
        setJerseyNo(editingTeam.jerseyNo?.toString() || '');
        setPassNo(editingTeam.passNo || '');
        setActive(editingTeam.active || false);
        setSelectedTeam({
          teamId: editingTeam.teamId,
          teamName: editingTeam.teamName,
          teamAlias: editingTeam.teamAlias,
          teamAgeGroup: editingTeam.teamAgeGroup,
          recommendedType: editingTeam.licenseType,
          status: editingTeam.status,
          clubId: editingClubId || clubId,
          clubName: effectiveClubName,
        });
        setSelectedClubId('');
      } else {
        setSelectedTeam(null);
        setSelectedLicenseType('');
        setJerseyNo('');
        setPassNo('');
        setActive(false);
        setSelectedClubId('');
      }
      setError(null);
    }
  }, [isOpen, editingTeam, editingClubId, clubId, effectiveClubName]);

  const licenseTypeLabels: Record<string, string> = {
    PRIMARY: 'Erstpass',
    SECONDARY: 'Zweitpass',
    OVERAGE: 'Over-Age',
    LOAN: 'Leihpass',
    HOBBY: 'Hobby',
    SPECIAL: 'Sonderpass',
  };

  const handleClubChange = (newClubId: string) => {
    setSelectedClubId(newClubId);
    setSelectedTeam(null);
    setSelectedLicenseType('');
  };

  const handleTeamChange = (team: PossibleTeam | null) => {
    setSelectedTeam(team);
    if (team) {
      setSelectedLicenseType(team.recommendedType || '');
    } else {
      setSelectedLicenseType('');
    }
  };

  const handleCancel = () => {
    setSelectedTeam(null);
    setSelectedLicenseType('');
    setJerseyNo('');
    setPassNo('');
    setActive(false);
    setSelectedClubId('');
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (!selectedTeam && !isEditMode) {
      setError('Bitte wähle eine Mannschaft aus.');
      return;
    }

    if (isAdmin && !isEditMode && !selectedClubId) {
      setError('Bitte wähle einen Verein aus.');
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
                  const passNoUpdate = isAdmin ? { passNo: passNo.trim() } : {};
                  if (teamChanged && selectedTeam) {
                    return {
                      ...team,
                      teamId: selectedTeam.teamId,
                      teamName: selectedTeam.teamName,
                      teamAlias: selectedTeam.teamAlias,
                      teamAgeGroup: selectedTeam.teamAgeGroup,
                      licenseType: selectedTeam.recommendedType as LicenseType,
                      jerseyNo: jerseyNumber,
                      active: active,
                      ...passNoUpdate,
                      modifyDate: new Date().toISOString(),
                    };
                  }
                  return {
                    ...team,
                    jerseyNo: jerseyNumber,
                    active: active,
                    ...passNoUpdate,
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
        const targetClubId = isAdmin ? selectedClubId : clubId;
        const targetClubName = isAdmin
          ? (clubs.find(c => c._id === selectedClubId)?.name || '')
          : clubName;
        const targetClubAlias = isAdmin
          ? (clubs.find(c => c._id === selectedClubId)?.alias || '')
          : '';

        const newTeamAssignment: AssignmentTeam = {
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.teamName,
          teamAlias: selectedTeam.teamAlias,
          teamType: TeamType.COMPETITIVE,
          teamAgeGroup: selectedTeam.teamAgeGroup,
          passNo: isAdmin ? passNo.trim() : '',
          licenseType: (selectedLicenseType || selectedTeam.recommendedType) as LicenseType,
          status: LicenseStatus.UNKNOWN,
          invalidReasonCodes: [],
          adminOverride: false,
          overrideReason: '',
          overrideDate: '',
          validFrom: new Date().toISOString(),
          validTo: '',
          source: Source.BISHL,
          modifyDate: new Date().toISOString(),
          active: active,
          jerseyNo: jerseyNumber,
        };

        const existingClubIndex = updatedAssignments.findIndex(
          (assignment) => assignment.clubId === targetClubId
        );

        if (existingClubIndex === -1) {
          updatedAssignments.push({
            clubId: targetClubId,
            clubName: targetClubName,
            clubAlias: targetClubAlias,
            clubIshdId: '',
            clubType: ClubType.MAIN,
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
  const noClubSelected = isAdmin && !isEditMode && !selectedClubId;

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
                  {isAdmin && (
                    isEditMode ? (
                      <ClubSelect
                        selectedClubId={editingClubId || clubId}
                        clubs={[{
                          _id: editingClubId || clubId,
                          name: effectiveClubName,
                          alias: editingAssignment?.clubAlias || '',
                        } as ClubValues]}
                        onClubChange={() => {}}
                        label="Verein"
                        disabled
                      />
                    ) : (
                      clubsLoading ? (
                        <div className="mb-4">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Verein
                          </label>
                          <div className="mt-2 rounded-md bg-gray-100 py-2 pl-3 pr-3 text-sm text-gray-400 ring-1 ring-inset ring-gray-200">
                            Laden...
                          </div>
                        </div>
                      ) : (
                        <ClubSelect
                          selectedClubId={selectedClubId || null}
                          clubs={clubs}
                          onClubChange={handleClubChange}
                          label="Verein"
                        />
                      )
                    )
                  )}

                  <TeamAssignmentSelect
                    playerId={playerId}
                    clubId={teamSelectClubId}
                    selectedTeamId={selectedTeam?.teamId || null}
                    onTeamChange={handleTeamChange}
                    label="Mannschaft"
                    disabled={noClubSelected}
                    managedByISHD={managedByISHD}
                    licenceType={editingTeam?.licenseType}
                    licenceSource={editingTeam?.source}
                    assignedTeamIds={currentAssignments.flatMap(a => a.teams.map(t => t.teamId))}
                    isAdmin={isAdmin}
                  />

                  {!isEditMode && (
                    <div>
                      <label htmlFor="licenseType" className="block text-sm font-medium leading-6 text-gray-900">
                        Passtyp
                      </label>
                      <select
                        id="licenseType"
                        value={selectedLicenseType}
                        onChange={(e) => setSelectedLicenseType(e.target.value)}
                        className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <option value="">– Bitte wählen –</option>
                        {Object.entries(licenseTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isAdmin && (
                    <div>
                      <label htmlFor="passNo" className="block text-sm font-medium leading-6 text-gray-900">
                        Passnummer
                      </label>
                      <input
                        type="text"
                        name="passNo"
                        id="passNo"
                        value={passNo}
                        onChange={(e) => setPassNo(e.target.value)}
                        disabled={isEditMode && editingTeam?.source === 'ISHD' && managedByISHD}
                        autoComplete="off"
                        className={`mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-3 shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6 ${
                          isEditMode && editingTeam?.source === 'ISHD' && managedByISHD
                            ? 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'
                            : 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'
                        }`}
                        placeholder="Optional"
                      />
                    </div>
                  )}

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
