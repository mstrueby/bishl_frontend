export interface NewClubAssignment {
  clubId: string;
  clubName: string;
  clubAlias: string;
  clubIshdId?: number;
  clubType: string;
  teams: {
    teamId: string;
    teamName: string;
    teamAlias: string;
    teamType: string;
    passNo: string;
    source: string;
    modifyDate: string;
  }[]
}[]

export interface AssignmentTeam {
  teamId: string;
  teamName: string;
  teamAlias: string;
  teamType: string; // e.g. "COMPETITIVE", "HOBBY"
  teamAgeGroup: string;
  teamIshdId?: string;
  passNo: string;
  licenseType: string; // e.g. "PRIMARY", "OVERAGE", "LOAN"
  status: string; // e.g. "VALID", "INVALID"
  invalidReasonCodes: string[] // e.g. ["MULTIPLE_PRIMARY"]
  adminOverride: boolean;
  overrideReason: string;
  overrideDate: string;
  validFrom: string;  // e.g. "2025-01-16T11:36:45.395Z"
  validTo: string;
  source: string; // e.g. "BISHL"
  modifyDate: string;  // e.g. "2025-01-16T11:36:45.395Z"
  active: boolean;
  jerseyNo?: number;
}

export interface Assignment {
  clubId: string;
  clubName: string;
  clubAlias: string;
  clubIshdId?: string | '';
  clubType: string; // e.g. "MAIN", "DEVELOPMENT"
  teams: AssignmentTeam[];
};


export interface PlayUpOccurrence {
  matchId: string;
  matchStartDate: string;  // e.g. "2025-01-16T11:36:45.395Z"
  counted: boolean;
}


export interface PlayUpTracking {
  tournamentAlias: string;
  seasonAlias: string;
  fromTeamId: string;
  toTeamId: string;
  occurrences: PlayUpOccurrence[];
};

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
  source: string; // e.g. "BISHL"
  sex: 'männlich' | 'weiblich';
  assignedTeams: Assignment[];
  playUpTrackings: PlayUpTracking[];
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
  imageVisible: boolean;
  image?: File;
  legacyId?: number;
  createDate?: string;  // e.g. "2025-01-16T11:36:45.395Z"
  ageGroup: string;
  overAge: boolean;
  managedByISHD?: boolean;
}