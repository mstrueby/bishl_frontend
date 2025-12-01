// Define a Team interface
export interface Team {
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
}

// Define a Match interface
export interface MatchValues {
  _id?: string;
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  status: string;
  venue: string;
  homeScore: number;
  awayScore: number;
  overtime: boolean;
  shootout: boolean;
  startTime: Date;
  published: boolean;
}

export interface StandingsTeam {
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  otWins: number;
  otLosses: number;
  soWins: number;
  soLosses: number;
  streak: string[];
}

export interface MatchdayOwner {
  clubId: string;
  clubName: string;
  clubAlias: string;
}

export interface MatchSettings {
  numOfPeriods: number;
  periodLengthMin: number;
  overtime: boolean;
  numOfPeriodsOvertime: number;
  periodLengthMinOvertime: number;
  shootout: boolean;
  refereePoints: number;
}

// Define a Matchday interface
export interface MatchdayValues {
  _id?: string;
  name: string;
  alias: string;
  type: {
    key: string;
    value: string;
  };
  startDate: Date | null;
  endDate: Date | null;
  createStandings: boolean;
  createStats: boolean;
  published: boolean;
  matchSettings: MatchSettings;
  standings?: StandingsTeam[];
  owner?: MatchdayOwner;
  links?: {
    self: string;
    matches: string;
    round: string;
  };
}

// Define a Round interface
export interface RoundValues {
  _id?: string;
  name: string;
  alias: string;
  createStandings: boolean;
  createStats: boolean;
  published: boolean;
  startDate: Date | null;
  endDate: Date | null;
  matchdaysType: {
    key: string;
    value: string;
  };
  matchdaysSortedBy: {
    key: string;
    value: string;
  };
  matchSettings: MatchSettings;
  standings?: StandingsTeam[];
  links?: {
    self: string;
    matchdays: string;
    sesaon: string;
  };
}

// Define a Season interface
export interface SeasonValues {
  _id?: string;
  name: string;
  alias: string;
  published: boolean;
  links?: {
    self: string;
    rounds: string;
    tournament: string;
  };
}

// Update the TournamentFormValues interface to use new sub-interfaces
export interface TournamentValues {
  _id?: string;
  name: string;
  alias: string;
  tinyName: string;
  ageGroup: {
    key: string;
    value: string;
  };
  published: boolean;
  active: boolean;
  external: boolean;
  website?: string;
  links?: {
    self: string;
    seasons: string;
  };
}
