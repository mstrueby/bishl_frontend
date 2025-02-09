export interface UserValues {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  club: {
    clubId: string;
    clubName: string;
  };
  roles: []
}