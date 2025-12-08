import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, TrashIcon, PencilIcon, CheckIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PenaltiesBase } from '../../types/MatchValues';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import apiClient from '../../lib/apiClient';
import { getErrorMessage } from '../../lib/errorHandler';

interface PenaltyListProps {
  teamName: string;
  matchId: string;
  teamFlag: string;
  penalties: PenaltiesBase[];
  showEditButton?: boolean;
  editUrl?: string;
  showEventButtons?: boolean;
  refreshMatchData: () => void;
  setIsPenaltyDialogOpen: (isOpen: boolean) => void;
  setEditingPenalty: (penalty: PenaltiesBase | undefined) => void;
}

const PenaltyList: React.FC<PenaltyListProps> = ({
  teamName,
  matchId,
  teamFlag,
  penalties,
  showEditButton,
  editUrl,
  showEventButtons,
  refreshMatchData,
  setIsPenaltyDialogOpen,
  setEditingPenalty
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [penaltyToDelete, setPenaltyToDelete] = useState<PenaltiesBase | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (penalty: PenaltiesBase) => {
    setPenaltyToDelete(penalty);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!penaltyToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/matches/${matchId}/${teamFlag}/penalties/${penaltyToDelete._id}`);
      refreshMatchData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error deleting penalty:', errorMessage);
      // Optionally show error to user
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setPenaltyToDelete(undefined);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b mb-3 border-gray-200 pb-3 flex items-center justify-between mt-3 sm:mt-0 sm:mx-3 min-h-[2.5rem]">
        <h3 className="text-md font-semibold text-gray-900 py-1.5 truncate">{teamName}</h3>
        <div className="flex items-center">
          {showEditButton && editUrl && (
            <Link href={editUrl} className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Bearbeiten
            </Link>
          )}
        </div>
      </div>
      {/* Penalty Table */}
      <div className="overflow-auto bg-white shadow-md rounded-md border">
        {penalties && penalties.length > 0 ? (
          <ul className="min-w-full divide-y divide-gray-200">
            {penalties
              .sort((a, b) => {
                const timeA = a.matchTimeStart.split(':').map(Number);
                const timeB = b.matchTimeStart.split(':').map(Number);
                const secondsA = timeA[0] * 60 + timeA[1];
                const secondsB = timeB[0] * 60 + timeB[1];
                return secondsA - secondsB;
              })
              .map((penalty, index) => (
                <li key={penalty._id} className="flex items-center justify-between py-3 px-4">
                  <div className="w-16 flex-shrink-0 text-xs text-gray-900 space-y-1 text-center w-8 mr-5">
                    <p>{penalty.matchTimeStart}</p>
                    <p>{penalty.matchTimeEnd || '-'}</p>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-900">
                      {penalty.penaltyPlayer ? `#${penalty.penaltyPlayer.jerseyNumber} ${penalty.penaltyPlayer.lastName}, ${penalty.penaltyPlayer.firstName}` : 'unbekannt'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {penalty.isGM && 'GM · '}
                      {penalty.isMP && 'MP · '}
                      {penalty.penaltyMinutes} Min. · {penalty.penaltyCode.key} - {penalty.penaltyCode.value}
                    </p>
                  </div>
                  {showEventButtons && (
                    <div className="flex justify-end space-x-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (setIsPenaltyDialogOpen && setEditingPenalty) {
                            setIsPenaltyDialogOpen(true);
                            setEditingPenalty(penalty);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(penalty)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <div className="text-center py-5 text-sm text-gray-500">
            Keine Strafen
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPenaltyToDelete(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        title="Strafe löschen"
        description={`Bist du sicher, dass du die Strafe von <strong>${penaltyToDelete?.penaltyPlayer ? `#${penaltyToDelete.penaltyPlayer.jerseyNumber} ${penaltyToDelete?.penaltyPlayer?.firstName} ${penaltyToDelete?.penaltyPlayer?.lastName} (Zeit ${penaltyToDelete?.matchTimeStart})` : 'Unbekannt'}</strong> löschen möchtest?`}
        descriptionSubText="Diese Aktion kann nicht rückgängig gemacht werden."
        isLoading={isDeleting}
      />
    </div>
  )
};

export default PenaltyList;