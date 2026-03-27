import { MatchValues } from "./MatchValues";
import { RefereeLevel } from "./UserValues";

export interface RefSummary {
  assignedCount: number;
  requestedCount: number;
  availableCount: number;
  unavailableCount: number;
  requestsByLevel: {
    [level in RefereeLevel]: number;
  }

}

export interface TournamentSummaryCounts {
  totalMatches: number;
  fullyAssigned: number;
  partiallyAssigned: number;
  unassigned: number;
}

export interface TournamentSummary {
  tournamentAlias: string;
  counts: TournamentSummaryCounts
}

export interface DayGroup {
  date: string;
  matches: MatchValues[];
  tournamentSummary: TournamentSummary[]
}

export interface RefToolMatch extends MatchValues {
  
}