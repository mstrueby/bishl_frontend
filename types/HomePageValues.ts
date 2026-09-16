export interface HomePageTeamSummary {
  fullName: string;
  shortName: string;
  tinyName: string;
  logo: string;
  goalsFor: number;
}

export interface HomePageMatchSummary {
  _id: string;
  tournament: {
    name: string;
    alias: string;
  };
  round: {
    name: string;
  };
  home: HomePageTeamSummary;
  away: HomePageTeamSummary;
  matchStatus: {
    key: string;
    value: string;
  };
  finishType: {
    key: string;
    value: string;
  };
  venue: {
    name: string;
  };
  startDate: string;
  hasReferee1: boolean;
  hasReferee2: boolean;
}

export interface HomePageTournamentSummary {
  _id: string;
  name: string;
  alias: string;
}

export interface HomePagePostSummary {
  _id: string;
  title: string;
  alias: string;
  excerpt: string;
  imageUrl: string;
  authorFirstName: string;
  authorLastName: string;
  updateDate: string;
}

export interface HomePageMatchDay {
  date: string;
  matches: HomePageMatchSummary[];
}