export interface TournamentFormValues {
  name: string;
  alias: string;
  tinyName: string;
  ageGroup: string;
  published: boolean;
  active: boolean;
  external: boolean;
  website: string;
  seasons: {
    year: number;
    published: boolean;
    rounds: {
      name: string;
      createStandings: boolean;
      createStats: boolean;
      published: boolean;
      startDate: Date;
      endDate: Date;
      matchdaysType: string;
      matchdaysSortedBy: string;
      matchdays: {
        name: string;
        type: string;
        startDate: Date;
        endDate: Date;
        createStandings: boolean;
        createStats: boolean;
        published: boolean;
        matches: {
          matchId: string;
          homeTeam: {
            fullName: string;
            shortName: string;
            tinyName: string;
            logo: string;
          }
          awayTeam: {
            fullName: string;
            shortName: string;
            tinyName: string;
            logo: string;
          }
          status: string;
          venue: string;
          homeScore: number;
          awayScore: number;
          overtime: boolean;
          shootout: boolean;
          startTime: Date;
          published: boolean;
        }[]
      }[]
    }[]
  }[]