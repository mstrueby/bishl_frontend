  // Define a Team interface
  export interface Team {
    fullName: string;
    shortName: string;
    tinyName: string;
    logo: string;
  }
 
// Define a Match interface
  export interface Match {
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
  export interface Matchday {
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
    createStandings: boolean;
    createStats: boolean;
    published: boolean;
    matches: Match[];
  }

  // Define a Round interface
  export interface Round {
    name: string;
    createStandings: boolean;
    createStats: boolean;
    published: boolean;
    startDate: Date;
    endDate: Date;
    matchdaysType: string;
    matchdaysSortedBy: string;
    matchdays: Matchday[];
  }

  // Define a Season interface
  export interface Season {
    year: number;
    published: boolean;
    rounds: Round[];
  }

  // Update the TournamentFormValues interface to use new sub-interfaces
  export interface TournamentFormValues {
    name: string;
    alias: string;
    tinyName: string;
    ageGroup: string;
    published: boolean;
    active: boolean;
    external: boolean;
    seasons: Season[];
  }
