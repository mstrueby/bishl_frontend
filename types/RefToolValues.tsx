import { MatchValues } from "./MatchValues";
import { RefereeLevel } from "./UserValues";
import { AssignmentReferee } from "./AssignmentValues";

export interface RefToolReferee extends AssignmentReferee {
  _id: string;
  status: string;
  position: number | null;
}

export interface RefToolOptions {
  matchId: string;
  assigned: RefToolReferee[];
  requested: RefToolReferee[];
  available: RefToolReferee[];
  unavailable: RefToolReferee[];
}

export interface RefSummary {
  assignedCount: number;
  requestedCount: number;
  availableCount: number;
  unavailableCount: number;
  requestsByLevel: {
    [level in RefereeLevel]: number;
  };
}

export interface SummaryCounts {
  totalMatches: number;
  fullyAssigned: number;
  partiallyAssigned: number;
  unassigned: number;
}

export interface DayStrip {
  date: string;
  counts: SummaryCounts;
}

export interface TournamentSummary {
  tournamentAlias: string;
  counts: SummaryCounts;
}

export interface RefToolMatch extends MatchValues {
  refSummary: RefSummary;
}

export interface RefToolMatchList {
  date: string;
  matches: RefToolMatch[];
  tournamentSummary: TournamentSummary[];
}
