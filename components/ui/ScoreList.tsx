import React, { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ScoresBase } from '../../types/MatchValues';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import apiClient from '../../lib/apiClient';

interface ScoresListProps {
  teamName: string;
  matchId: string;
  teamFlag: string;
  scores: ScoresBase[];
  showEditButton?: boolean;
  editUrl?: string;
  showEventButtons?: boolean;
  refreshMatchData?: () => void;
  setIsGoalDialogOpen?: (open: boolean) => void;
  setEditingGoal?: (goal: ScoresBase | undefined) => void;
}

const ScoresList: React.FC<ScoresListProps> = ({
  teamName,
  matchId,
  teamFlag,
  scores,
  showEditButton,
  editUrl,
  showEventButtons,
  refreshMatchData,
  setIsGoalDialogOpen,
  setEditingGoal,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<ScoresBase | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (goal: ScoresBase) => {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!goalToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/matches/${matchId}/${teamFlag}/scores/${goalToDelete._id}`);
      
      if (refreshMatchData) {
        refreshMatchData();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setGoalToDelete(undefined);
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
      {/* Scores Table */}
      <div className="overflow-auto bg-white shadow-md rounded-md border">
        {scores && scores.length > 0 ? (
          <ul className="min-w-full divide-y divide-gray-200">
            {scores
              .sort((a, b) => {
                // Convert matchTime (format: "mm:ss") to seconds for comparison
                const timeA = a.matchTime.split(":").map(Number);
                const timeB = b.matchTime.split(":").map(Number);
                const secondsA = timeA[0] * 60 + timeA[1];
                const secondsB = timeB[0] * 60 + timeB[1];
                return secondsA - secondsB;
              })
              .map((score) => (
                <li key={`${score._id}`} className="flex items-center py-3 px-4">
                  <div className="w-16 flex-shrink-0 text-xs text-gray-900 text-center w-8 mr-5">
                    {score.matchTime}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-900">
                      {score.goalPlayer ? `#${score.goalPlayer.jerseyNumber} ${score.goalPlayer.lastName}, ${score.goalPlayer.firstName}` : 'Unbekannt'}
                    </p>
                    {score.assistPlayer ? (
                      <p className="text-xs text-gray-500">
                        #{score.assistPlayer.jerseyNumber} {score.assistPlayer.lastName}, {score.assistPlayer.firstName}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">keine Vorlage</p>
                    )}
                  </div>
                  {showEventButtons && (
                    <div className="flex justify-end space-x-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (setIsGoalDialogOpen && setEditingGoal) {
                            setIsGoalDialogOpen(true);
                            setEditingGoal(score);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(score)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isDeleting} // Disable button when deleting
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
            Keine Tore
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        title="Tor löschen"
        description={`Bist du sicher, dass du das Tor von <strong>${goalToDelete?.goalPlayer ? `#${goalToDelete.goalPlayer.jerseyNumber} ${goalToDelete.goalPlayer.firstName} ${goalToDelete.goalPlayer.lastName} (Zeit ${goalToDelete.matchTime})` : 'Unbekannt'}</strong> löschen möchtest?`}
        descriptionSubText="Das Ergebnis wird um 1 verringert. Diese Aktion kann nicht rückgängig gemacht werden."
        isLoading={isDeleting} // Pass loading state to modal's confirm button
      />
    </div>
  );
};

export default ScoresList;