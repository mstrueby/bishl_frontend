export enum RefereeLevel {
  NA = 'n/a',
  SM = 'SM',
  S3 = 'S3',
  S2 = 'S2',
  S1 = 'S1',
  PM = 'PM',
  P3 = 'P3',
  P2 = 'P2',
  P1 = 'P1'
}

export interface RefereeTournamentPoints {
  tournamentAlias: string;
  points: number;
  matches: string[];
}

export interface RefereeSeasonPoints {
  seasonAlias: string;
  tournaments: RefereeTournamentPoints[]
}

export interface UserReferee {
  level: RefereeLevel;
  passNo: string;
  ishdLevel: string;
  active: boolean;
  club?: {
    clubId: string;
    clubName: string;
    logoUrl: string;
  };
  points: RefereeSeasonPoints[];
}

export interface UserValues {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  club?: {
    clubId: string;
    clubName: string;
    logoUrl: string;
  } | null;
  referee?: UserReferee | null;
  roles: string[];
}