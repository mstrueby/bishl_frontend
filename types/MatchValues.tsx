export interface EventPlayer {
  playerId: string;
  firstName: string;
  lastName: string
  jerseyNumber: number;
  displayFirstName?: string;
  displayLastName?: string
  imageUrl?: string;
  imageVisible?: boolean;
}


export interface RosterPlayer {
  player: EventPlayer,
  playerPosition: {
    key: string;
    value: string;
  },
  passNumber: string;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;
  called: boolean;
}

export interface ScoresBase {
  _id?: string;
  matchTime: string;
  goalPlayer: EventPlayer;
  assistPlayer?: EventPlayer | null;
  isPPG?: boolean;
  isSHG?: boolean;
  isGWG?: boolean;
}

export interface PenaltiesBase {
  _id?: string;
  matchTimeStart: string;
  matchTimeEnd?: string;
  penaltyPlayer: EventPlayer;
  penaltyCode: { [key: string]: string };
  penaltyMinutes: number;
  isGM?: boolean;
  isMP?: boolean;
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
  coach?: {
    firstName?: string;
    lastName?: string;
    licence?: string;
  }
  staff?: {
    firstName: string;
    lastName: string;
    role: string;
  }[]
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

export interface RefereePaymentDetails {
  travelExpenses?: number;
  expenseAllowance?: number;
  gameFees?: number;
}

export interface RefereePayment {
  referee1?: RefereePaymentDetails;
  referee2?: RefereePaymentDetails;
}

export interface SupplementarySheet {
  refereeAttendance?: string; // yes, only 1, no referee, substitute referee
  referee1PassAvailable?: boolean;
  referee2PassAvailable?: boolean;
  referee1DelayMin?: number;
  referee2DelayMin?: number;
  // Nutzungserlaubnis
  ruleBook?: boolean;
  goalDisplay?: boolean;
  soundSource?: boolean;
  matchClock?: boolean;
  matchBalls?: boolean;
  firstAidKit?: boolean;
  fieldLines?: boolean;
  nets?: boolean;
  homeRoster?: boolean;
  homePlayerPasses?: boolean;
  homeUniformPlayerClothing?: boolean;
  awayRoster?: boolean;
  awayPlayerPasses?: boolean;
  awayUniformPlayerClothing?: boolean;
  awaySecondJerseySet?: boolean;
  refereePayment?: RefereePayment;
  specialEvents?: boolean;
  refereeComments?: string;
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
  matchSheetComplete?: boolean;
  supplementarySheet?: SupplementarySheet;
}