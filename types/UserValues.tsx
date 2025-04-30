export interface RefereeValues {
  level: string;
  passNo: string;
  ishdLevel: string;
  active: boolean;
}

export interface UserValues {
  _id: string;
  email: string;
  //password: string;
  firstName: string;
  lastName: string;
  club?: {
    clubId: string;
    clubName: string;
  };
  referee?: RefereeValues;
  roles: []
}