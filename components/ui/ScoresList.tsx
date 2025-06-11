import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ChevronLeftIcon, TrashIcon, PencilIcon, CheckIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ScoresBase } from '../../types/MatchValues';
import GoalRegisterForm from '../../pages/matches/[id]/[teamFlag]/scores';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ScoresListProps {
  jwt: string;
  teamName: string;
  matchId: string;
  scores: ScoresBase[];
  showEditButton?: boolean;
  editUrl?: string;
  refreshMatchData?: () => void;
  setIsHomeGoalDialogOpen?: (open: boolean) => void;
  setEditingHomeGoal?: (goal: ScoresBase | null) => void;
}

const ScoresList: React.FC<ScoresListProps> = ({
  jwt,
  teamName,
  matchId,
  scores,
  showEditButton = false,
  editUrl,
  refreshMatchData,
  setIsHomeGoalDialogOpen,
  setEditingHomeGoal,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<ScoresBase | null>(null);

  const handleDeleteClick = (goal: ScoresBase) => {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!goalToDelete) return;

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${matchId}/home/scores/${goalToDelete._id}`,
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
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
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
              .map((goal, index) => (
                <li key={`home-goal-${index}`} className="flex items-center py-3 px-4">
                    <div className="w-16 flex-shrink-0 text-sm text-gray-900">
                      {goal.matchTime}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-900">
                        {goal.goalPlayer ? `#${goal.goalPlayer.jerseyNumber} ${goal.goalPlayer.firstName} ${goal.goalPlayer.lastName}` : 'Unbekannt'}
                      </p>
                      {goal.assistPlayer ? (
                        <p className="text-xs text-gray-500">
                          #{goal.assistPlayer.jerseyNumber} {goal.assistPlayer.firstName} {goal.assistPlayer.lastName}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">keine Vorlage</p>
                      )}
                    </div>
                    {showEditButton && (
                      <div className="flex justify-end space-x-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (setIsHomeGoalDialogOpen && setEditingHomeGoal) {
                              setIsHomeGoalDialogOpen(true);
                              setEditingHomeGoal(goal);
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(goal)}
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
          <div className="text-center py-4 text-sm text-gray-500">
            Keine Tore
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Tor löschen"
        description={`Sind Sie sicher, dass Sie das Tor von <strong>${goalToDelete?.goalPlayer ? `#${goalToDelete.goalPlayer.jerseyNumber} ${goalToDelete.goalPlayer.firstName} ${goalToDelete.goalPlayer.lastName}` : 'Unbekannt'}</strong> löschen möchten?`}
        descriptionSubText="Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
};

export default ScoresList;