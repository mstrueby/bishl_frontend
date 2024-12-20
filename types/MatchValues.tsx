interface TeamStats {
  goalsFor: number;
  goalsAgainst: number;
}

interface Team {
  clubAlias: string;
  teamAlias: string;
  name: string;
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  stats: TeamStats;

}

export interface Referee {
  _id: string;
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
  maatchday: {
    name: string;
    alias: string;
  }
  home: Team;
  away: Team;
  matchStatus: { key: string; value: string };
  finishType: { key: string; value: string };
  venue: {
    name: string;
    alias: string;
  };
  startDate: Date;
  published: boolean;
  referee1?: Referee;
  referee2?: Referee;
}