  // Define a Team interface
  export interface Team {
    fullName: string;
    shortName: string;
    tinyName: string;
    logo: string;
  }
 
// Define a Match interface
  export interface MatchValues {
    _id: string;
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

  // Define a Matchday interface
  export interface MatchdayValues {
    _id: string;
    name: string;
    alias: string;
    type: string;
    startDate: Date;
    endDate: Date;
    createStandings: boolean;
    createStats: boolean;
    published: boolean;
    matches: MatchValues[];
  }

  // Define a Round interface
  export interface RoundValues {
    _id: string;
    name: string;
    alias: string;
    createStandings: boolean;
    createStats: boolean;
    published: boolean;
    startDate: Date;
    endDate: Date;
    matchdaysType: string;
    matchdaysSortedBy: string;
    matchdays: MatchdayValues[];
  }

  // Define a Season interface
  export interface SeasonValues {
    _id: string;
    name: string;
    alias: string;
    published: boolean;
    rounds: RoundValues[];
  }

  // Update the TournamentFormValues interface to use new sub-interfaces
  export interface TournamentValues {
    _id?: string;
    name: string;
    alias: string;
    tinyName: string;
    ageGroup: string;
    published: boolean;
    active: boolean;
    external: boolean;
    seasons: SeasonValues[];
  }
