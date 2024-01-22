// Define a Team interface
export interface Team {
  name: string;
  alias: string;
  fullName: string;
  shortName: string;
  tinyName: string;
  ageGroup: string;
  teamNumber: number;
  active: boolean;
  external: boolean;
  ishdId: string;
  legacyId: number;
}

export interface ClubFormValues {
  name: string;
  alias: string;
  addressName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  email: string;
  yearOfFoundation: number;
  description: string;
  website: string;
  ishdId: number;
  active: boolean;
  logo: string;
  legacyId: number;
  teams: Team[]; // Use the new Team interface
}