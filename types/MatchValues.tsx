import { boolean } from "yup";

interface EventPlayer {
  playerId: string;
  firstName: string;
  lastName: string
  jerseyNumber: number;
}


export interface RosterPlayer {
  player: EventPlayer,
  playerPosition: {
    key: string;
    value: string;
  },
  passNumber: string;
  called: boolean;
}

export interface ScoresBase {
  _id?: string;
  matchTime: string;
  goalPlayer: EventPlayer;
  assistPlayer?: EventPlayer;
  isPPG?: boolean;
  isSHG?: boolean;
  isGWG?: boolean;
}

export interface PenaltiesBase {
  _id?: string;
  matchTimeStart: string
  matchTimeEnd?: string;
  penaltyPlayer: EventPlayer;
  penaltyCode: { [key: string]: string };
  penaltyMinutes: number;
  isGM?: boolean
  isMP?: boolean
}

interface TeamStats {
  goalsFor: number;
  goalsAgainst: number;
}

export interface Team {
  clubId: string;
  clubName: string;
  clubAlias: string;
  teamId: string;
  teamAlias: string;
  name: string;
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  stats: TeamStats;
  roster?: RosterPlayer[];
  rosterPublished?: boolean;
  scores?: ScoresBase[];
  penalties?: PenaltiesBase[];
}

export interface Referee {
  userId: string;
  firstName: string;
  lastName: string;
  clubId?: string;
  clubName?: string;
  points: number;
}

export interface Match {
  _id: string;
  matchId: number;
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
  }
  home: Team;
  away: Team;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  venue: {
    venueId: string;
    name: string;
    alias: string;
  };
  startDate: Date;
  published: boolean;
  referee1?: Referee;
  referee2?: Referee;
}