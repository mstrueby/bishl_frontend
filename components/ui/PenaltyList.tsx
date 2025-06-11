import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ChevronLeftIcon, TrashIcon, PencilIcon, CheckIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PenaltiesBase } from '../../types/MatchValues';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface PenaltyListProps {
  jwt: string;
  teamName: string;
  matchId: string;
  teamFlag: string;
  penalties: PenaltiesBase[];
  showEditButton?: boolean;
  editUrl?: string;
  refreshMatchData: () => void;
  setIsPenaltyDialogOpen: (isOpen: boolean) => void;
  setEditingPenalty: (penalty: PenaltiesBase | null) => void;
}

const PenaltyList: React.FC<PenaltyListProps> = ({
  jwt,
  teamName,
  matchId,
  teamFlag,
  penalties,
  showEditButton = false,
  editUrl,
  refreshMatchData,
  setIsPenaltyDialogOpen,
  setEditingPenalty
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [penaltyToDelete, setPenaltyToDelete] = useState<PenaltiesBase | null>(null);

  const handleDeleteClick = (penalty: PenaltiesBase) => {
    setPenaltyToDelete(penalty);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!penaltyToDelete) return;
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/${teamFlag}/penalties/${penaltyToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.status === 200 || response.status === 204) {
        if (refreshMatchData) {
          refreshMatchData();
        }
      }
      refreshMatchData();
    } catch (error) {
      console.error('Error deleting penalty:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setPenaltyToDelete(null);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b mb-3 border-gray-200 pb-3 flex items-center justify-between mt-3 sm:mt-0 sm:mx-3">
        <h3 className="text-md font-semibold text-gray-900 truncate">{teamName}</h3>
        {showEditButton && editUrl && (
          <Link href={editUrl}>
            <a className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Bearbeiten
            </a>
          </Link>
        )}
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
                      {penalty.penaltyMinutes} Min. · {penalty.penaltyCode.key} - {penalty.penaltyCode.value}
                    </p>
                  </div>
                  {showEditButton && (
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
    </div>
  )
};

export default PenaltyList;