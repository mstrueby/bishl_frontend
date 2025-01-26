
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ClubSelect from './ClubSelect';
import TeamSelect from './TeamSelect';
import { ClubValues, TeamValues } from '../../types/ClubValues';
import { NewClubAssignment } from '../../types/PlayerValues';
import InputText from './form/InputText';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: NewClubAssignment) => void;
  clubs: ClubValues[];
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clubs,
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [passNo, setPassNo] = useState<string>('');
  
  const selectedClub = clubs.find(club => club._id === selectedClubId);
  
  const handleSave = () => {
    if (selectedClub && selectedTeamId && passNo) {
      const selectedTeam = selectedClub.teams.find(team => team._id === selectedTeamId);
      if (selectedTeam) {
        onSave({
          clubId: selectedClub._id,
          clubName: selectedClub.name,
          clubAlias: selectedClub.alias,
          clubIshdId: selectedClub.ishdId,
          teams: [{
            teamId: selectedTeam._id,
            teamName: selectedTeam.name,
            passNo: passNo,
            active: true,
            modifyDate: new Date().toISOString()
          }]
        });
        onClose();
      }
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                  Neue Mannschaftszuweisung
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <ClubSelect
                    selectedClubId={selectedClubId}
                    clubs={clubs}
                    onClubChange={setSelectedClubId}
                  />
                  {selectedClub && (
                    <TeamSelect
                      selectedTeamId={selectedTeamId}
                      teams={selectedClub.teams || []}
                      onTeamChange={setSelectedTeamId}
                    />
                  )}
                  <div className="mt-2">
                    <label htmlFor="passNo" className="block text-sm font-medium text-gray-700">
                      Pass-Nummer
                    </label>
                    <input
                      type="text"
                      name="passNo"
                      id="passNo"
                      value={passNo}
                      onChange={(e) => setPassNo(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={handleSave}
                  >
                    Speichern
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
