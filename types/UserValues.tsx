export interface RefereeValues {
  level: string;
  passNo: string;
  ishdLevel: string;
  active: boolean;
  club?: {
    clubId: string;
    clubName: string;
    logoUrl: string;
  };
  points: number;
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
  referee?: RefereeValues | null;
  roles: string[];
}