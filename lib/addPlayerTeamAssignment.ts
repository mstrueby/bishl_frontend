import apiClient from './apiClient';
import type { ClubValues, TeamValues } from '../types/ClubValues';
import {
  Assignment, AssignmentTeam, ClubType, LicenseStatus, LicenseType,
  PlayerValues, Source,
} from '../types/PlayerValues';

export function appendPlayerTeamAssignment(
  assignments: Assignment[],
  club: ClubValues,
  team: TeamValues,
  now = new Date().toISOString(),
): Assignment[] {
  if (assignments.some(assignment => assignment.teams.some(item => item.teamId === team._id))) {
    throw new Error('Dieser Spieler ist dieser Mannschaft bereits zugeordnet.');
  }

  const newTeam: AssignmentTeam = {
    teamId: team._id,
    teamName: team.name,
    teamAlias: team.alias,
    teamType: team.teamType,
    teamAgeGroup: team.ageGroup,
    teamIshdId: team.ishdId || '',
    passNo: '',
    licenseType: LicenseType.UNKNOWN,
    status: LicenseStatus.UNKNOWN,
    invalidReasonCodes: [],
    adminOverride: false,
    overrideReason: '',
    overrideDate: '',
    validFrom: now,
    validTo: '',
    source: Source.BISHL,
    modifyDate: now,
    active: true,
    isCallable: true,
  };

  const clubIndex = assignments.findIndex(assignment => assignment.clubId === club._id);
  if (clubIndex === -1) {
    return [...assignments, {
      clubId: club._id,
      clubName: club.name,
      clubAlias: club.alias,
      clubIshdId: club.ishdId || '',
      clubType: ClubType.MAIN,
      teams: [newTeam],
    }];
  }

  return assignments.map((assignment, index) => index === clubIndex
    ? { ...assignment, teams: [...assignment.teams, newTeam] }
    : assignment);
}

export async function addPlayerTeamAssignment(
  playerId: string,
  club: ClubValues,
  team: TeamValues,
): Promise<PlayerValues> {
  // Search results may be partial or stale. Preserve assignments from a fresh record.
  const response = await apiClient.get<PlayerValues>(`/players/${playerId}`);
  const player = response.data;
  if (!player?._id || (player.assignedTeams != null && !Array.isArray(player.assignedTeams))) {
    throw new Error('Die Mannschaftszuordnungen konnten nicht geladen werden.');
  }
  const assignedTeams = appendPlayerTeamAssignment(player.assignedTeams || [], club, team);
  const formData = new FormData();
  formData.append('assignedTeams', JSON.stringify(assignedTeams));
  // Send only the changed field, using the same format as the player edit page.
  await apiClient.patch(`/players/${playerId}`, formData);
  return player;
}
