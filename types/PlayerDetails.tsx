export interface PlayerStat {
  season?: { alias: string; name: string };
  tournament?: { alias: string; name: string };
  team?: { name: string };
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  calledMatches?: number;
}

export interface PlayerAssignedTeam {
  team?: { name: string; fullName: string };
  licenceType?: string;
  passNumber?: string;
  source?: string;
  status?: string;
}

export interface PlayerDetails {
  stats?: PlayerStat[];
  assignedTeams?: PlayerAssignedTeam[];
  birthDate?: string;
  fullFaceReq?: boolean;
}
