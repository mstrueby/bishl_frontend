export interface RosterPlayer {
  player: {
    playerId: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number;
  },
  playerPosition: {
    key: string;
    value: string;
  },
  passNumber: string;
  called: boolean;
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
  maatchday: {
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