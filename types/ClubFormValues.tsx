export interface ClubFormValues {
  name: string;
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
  teams: {
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
  }[];
}
