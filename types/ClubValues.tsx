export interface TeamPartnership {
  clubId: string;
  clubAlias: string
  clubName: string;
  teamId: string;
  teamAlias: string;
  teamName: string;
}


// Define a Team interface
export interface TeamValues {
  _id: string;
  name: string;
  alias: string;
  fullName: string;
  shortName: string;
  tinyName: string;
  ageGroup: string;
  teamNumber: number;
  teamPartnership?: TeamPartnership[];  
  active: boolean;
  external: boolean;
  logoUrl: string;
  ishdId: string;
  legacyId?: number;
}

export interface ClubValues {
  _id: string;
  name: string;
  alias: string;
  addressName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  email: string;
  yearOfFoundation: number | '';
  description: string;
  website: string;
  ishdId: string | '';
  active: boolean;
  logoUrl: string;
  legacyId: string | '';
  teams: TeamValues[]; // Use the new Team interface
}