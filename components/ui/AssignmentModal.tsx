import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ClubSelect from './ClubSelect';
import TeamSelect from './TeamSelect';
import { ClubValues, TeamValues } from '../../types/ClubValues';
import { Assignment, AssignmentTeam } from '../../types/PlayerValues';
import InputText from './form/InputText';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Assignment) => void;
  clubs: ClubValues[];
  currentAssignments?: Assignment[];
  nextAgeGroupOnly?: boolean;
  ageGroup?: string;
}

const ageGroupConfig = {
  key: "AGEGROUP",
  name: "Altersklasse",
  value: [
    { key: "MEN", value: "Herren", sortOrder: 1, altKey: "Herren" },
    { key: "WOMEN", value: "Damen", sortOrder: 2, altKey: "Damen" },
    { key: "U19", value: "U19", sortOrder: 3, altKey: "Junioren" },
    { key: "U16", value: "U16", sortOrder: 4, altKey: "Jugend" },
    { key: "U13", value: "U13", sortOrder: 5, altKey: "Schüler" },
    { key: "U10", value: "U10", sortOrder: 6, altKey: "Bambini" },
    { key: "U8", value: "U8", sortOrder: 7, altKey: "Mini" }
  ]
};

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clubs = [],
  currentAssignments = [],
  nextAgeGroupOnly = false,
  ageGroup,
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [ageGroupAssignment, setAgeGroupAssignment] = useState<AssignmentTeam | null>(null); // assignment matched with players age group
  const getAgeGroupAltKey = (key: string) => ageGroupConfig.value.find(ag => ag.key === key)?.altKey;
  const [passNo, setPassNo] = useState<string>(nextAgeGroupOnly && ageGroupAssignment?.passNo ? ageGroupAssignment.passNo : '');

  useEffect(() => {
    if (nextAgeGroupOnly && ageGroupAssignment?.passNo) {
      setPassNo(ageGroupAssignment.passNo);
    }
  }, [ageGroupAssignment, nextAgeGroupOnly]);

  useEffect(() => {
    if (clubs && clubs.length === 1) {
      setSelectedClubId(clubs[0]._id);
    }
  }, [clubs]);

  useEffect(() => {
    if (currentAssignments && ageGroup) {
      const matchingTeam = currentAssignments.reduce((foundTeam: AssignmentTeam | null, assignment) => {
        if (foundTeam) return foundTeam;
        const matchedTeam = assignment.teams.find(team => {
          const selectedTeam = clubs.find(club => club._id === assignment.clubId)?.teams
            .find(t => t._id === team.teamId);
          return selectedTeam?.ageGroup === getAgeGroupAltKey(ageGroup || '');
        });

        return matchedTeam || null;
      }, null);
      setAgeGroupAssignment(matchingTeam || null);
    } else {
      setAgeGroupAssignment(null);
    }
  }, [currentAssignments, ageGroup, clubs])

  console.log("ageGroupAssignement", ageGroupAssignment)
  const selectedClub = clubs.find(club => club._id === selectedClubId);

  const isFormComplete = selectedClubId && selectedTeamId && passNo.trim() !== '';

  const handleSave = () => {
    if (selectedClub && selectedTeamId && passNo) {
      const selectedTeam = selectedClub.teams.find(team => team._id === selectedTeamId);
      if (selectedTeam) {
        const assignment: Assignment = {
          clubId: selectedClub._id,
          clubName: selectedClub.name,
          clubAlias: selectedClub.alias,
          teams: [{
            teamId: selectedTeam._id,
            teamName: selectedTeam.name,
            teamAlias: selectedTeam.alias,
            passNo: passNo,
            source: 'BISHL',
            modifyDate: new Date().toISOString(),
            active: false
          }]
        };
        onSave(assignment);
        setSelectedClubId(null);
        setSelectedTeamId(null);
        setPassNo('');
        onClose();
      }
    }
  };

  const handleCancel = () => {
    setSelectedClubId(null);
    setSelectedTeamId(null);
    setPassNo('');
    onClose();
  }

  const handleClubChange = (clubId: string | null) => {
    setSelectedClubId(clubId);
    setSelectedTeamId(null); //reset team selection when club changes
  }

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
              <Dialog.Panel className="w-full max-w-md p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                <Dialog.Title as="h3" className="text-lg text-center font-bold leading-6 text-gray-900 mb-4">
                  Neue Mannschaftszuweisung
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <ClubSelect
                    selectedClubId={selectedClubId}
                    clubs={clubs}
                    onClubChange={handleClubChange}
                  />
                  {selectedClub && (
                    <TeamSelect
                      selectedTeamId={selectedTeamId}
                      teams={(selectedClub.teams || []).filter(team => {
                        // First check if team is already assigned
                        const isTeamAssigned = currentAssignments?.find(assignment =>
                          assignment.clubId === selectedClub._id &&
                          assignment.teams.some(t => t.teamId === team._id)
                        );
                        if (isTeamAssigned) return false;
                        // If nextAgeGroupOnly is true, check age group sort order
                        if (nextAgeGroupOnly && ageGroup) {
                          const playerAgeGroupConfig = ageGroupConfig.value.find(ag => ag.key === ageGroup);
                          const teamAgeGroupConfig = ageGroupConfig.value.find(ag => ag.altKey === team.ageGroup);
                          return !!playerAgeGroupConfig && !!teamAgeGroupConfig && teamAgeGroupConfig.sortOrder === playerAgeGroupConfig.sortOrder - 1;
                        }
                        return true;
                      })}
                      onTeamChange={setSelectedTeamId}
                    />
                  )}
                  {selectedTeamId && (
                    <div className="">
                      <label htmlFor="passNo" className="block text-sm font-medium mb-2 leading-6 text-gray-900">
                        Pass-Nummer
                      </label>
                      <input
                        type="text"
                        name="passNo"
                        id="passNo"
                        value={passNo}
                        onChange={(e) => setPassNo(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleCancel}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isFormComplete
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-300 cursor-not-allowed'
                      }`}
                    onClick={handleSave}
                    disabled={!isFormComplete}
                  >
                    Übernehmen
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