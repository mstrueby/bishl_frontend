export interface PlayerValues {
  _id: string;
  firstName: string;
  lastName: string;
  birthdate: string;  // e.g. "2025-01-16T11:36:45.395Z"
  displayFirstName: string;
  displayLastName: string;
  nationality: string;
  position?: "Skater";
  fullFaceReq: boolean;
  source?: string; // e.g. "BISHL"
  assignedTeams: {
    clubId: string;
    clubName: string;
    clubAlias: string;
    clubIshdId: number;
    teams: {
      teamId: string;
      teamName: string;
      teamAlias: string;
      teamIshdId: string;
      passNo: string;
      source: string; // e.g. "BISHL"
      modifyDate: string;  // e.g. "2025-01-16T11:36:45.395Z"
      jerseyNo: number;
      active: boolean;
    }[];
  }[];
  stats?: {
    tournament: {
      name: string;
      alias: string;
    };
    season: {
      name: string;
      alias: string;
    };
    round: {
      name: string;
      alias: string;
    };
    matchday: {
      name: string;
      alias: string;
    };
    team: {
      name: string;
      fullName: string;
      shortName: string;
      tinyName: string;
    };
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    penaltyMinutes: number;
  }[];
  imageUrl: string;
  legacyId?: number;
  createDate?: string;  // e.g. "2025-01-16T11:36:45.395Z"
}