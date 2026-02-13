import { TeamType } from "./ClubValues"
  
export enum Source {
  ISHD = "ISHD",
  BISHL = "BISHL",
  CALLED = "CALLED",
}

export enum ClubType {
  MAIN = "MAIN",
  LOAN = "LOAN",
  DEVELOPMENT = "DEVELOPMENT",
}

export enum LicenseType {
  UNKNOWN = "UNKNOWN",
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  OVERAGE = "OVERAGE",
  LOAN = "LOAN",
  HOBBY = "HOBBY",
  SPECIAL = "SPECIAL",
}

export enum LicenseStatus {
  UNKNOWN = "UNKNOWN",
  VALID = "VALID",
  INVALID = "INVALID",
}

export enum LicenseInvalidReasonCode {
  MULTIPLE_PRIMARY = "MULTIPLE_PRIMARY",
  TOO_MANY_LOAN = "TOO_MANY_LOAN",
  LOAN_CLUB_CONFLICT = "LOAN_CLUB_CONFLICT",
  LOAN_AGE_GROUP_CONFLICT = "LOAN_AGE_GROUP_CONFLICT",
  AGE_GROUP_VIOLATION = "AGE_GROUP_VIOLATION",
  OVERAGE_NOT_ALLOWED = "OVERAGE_NOT_ALLOWED",
  EXCEEDS_WKO_LIMIT = "EXCEEDS_WKO_LIMIT",
  CONFLICTING_CLUB = "CONFLICTING_CLUB",
  IMPORT_CONFLICT = "IMPORT_CONFLICT",
  UNKNOWN_LICENCE_TYPE = "UNKNOWN_LICENCE_TYPE",
  HOBBY_PLAYER_CONFLICT = "HOBBY_PLAYER_CONFLICT",
  SUSPENDED = "SUSPENDED",
}

export interface NewClubAssignment {
  clubId: string;
  clubName: string;
  clubAlias: string;
  clubIshdId?: number;
  clubType: ClubType;
  teams: {
    teamId: string;
    teamName: string;
    teamAlias: string;
    teamType: string;
    passNo: string;
    source: string;
    modifyDate: string;
  }[];
}
[];

export interface AssignmentTeam {
  teamId: string;
  teamName: string;
  teamAlias: string;
  teamType: TeamType; // e.g. "COMPETITIVE", "HOBBY"
  teamAgeGroup: string;
  teamIshdId?: string;
  passNo: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  invalidReasonCodes: LicenseInvalidReasonCode[];
  adminOverride: boolean;
  overrideReason: string;
  overrideDate: string;
  validFrom: string; // e.g. "2025-01-16T11:36:45.395Z"
  validTo: string;
  source: Source;
  modifyDate: string; // e.g. "2025-01-16T11:36:45.395Z"
  active: boolean;
  jerseyNo?: number;
}

export interface Assignment {
  clubId: string;
  clubName: string;
  clubAlias: string;
  clubIshdId?: string | "";
  clubType: ClubType; // e.g. "MAIN", "DEVELOPMENT"
  teams: AssignmentTeam[];
}

export interface PlayUpOccurrence {
  matchId: string;
  matchStartDate: string; // e.g. "2025-01-16T11:36:45.395Z"
  counted: boolean;
}

export interface PlayUpTracking {
  tournamentAlias: string;
  seasonAlias: string;
  fromTeamId: string;
  toTeamId: string;
  occurrences: PlayUpOccurrence[];
}

export interface Suspension {
  startDate: string; // e.g. "2025-01-16T11:36:45.395Z"
  endDate?: string; // e.g. "2025-01-16T11:36:45.395Z"
  reason: string;
  teamIds?: string[];
  tournamentAlias: string;
  seasonAlias: string;
  totalGames: number;
  gamesServed: number;
  globalLock: boolean;
  active: boolean;
}

export interface PlayerValues {
  _id: string;
  firstName: string;
  lastName: string;
  birthdate: string; // e.g. "2025-01-16T11:36:45.395Z"
  displayFirstName: string;
  displayLastName: string;
  nationality: string;
  position?: "Skater";
  fullFaceReq: boolean;
  source: string; // e.g. "BISHL"
  sex: "männlich" | "weiblich";
  assignedTeams: Assignment[];
  playUpTrackings: PlayUpTracking[];
  suspensions: Suspension[];
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
    calledMatches?: number;
  }[];
  imageUrl: string;
  imageVisible: boolean;
  image?: File;
  legacyId?: number;
  createDate?: string; // e.g. "2025-01-16T11:36:45.395Z"
  ageGroup: string;
  overAge: boolean;
  managedByISHD?: boolean;
}
