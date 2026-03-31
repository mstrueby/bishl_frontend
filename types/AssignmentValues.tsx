import { RefereeLevel } from "./UserValues"

export enum AssignmentStatus {
  AVAILABLE = "AVAILABLE",
  REQUESTED = "REQUESTED",
  UNAVAILABLE = "UNAVAILABLE",
  ASSIGNED = "ASSIGNED",
  ACCEPTED = "ACCEPTED"
}

export interface AssignmentReferee {
  userId: string;
  firstName: string;
  lastName: string;
  clubId?: string;
  clubName?: string;
  logoUrl?: string;
  level: RefereeLevel;
  points?: number;
}

export interface AssignmentValues {
  _id: string;
  matchId: string;
  status: AssignmentStatus;
  referee: AssignmentReferee;
  position: number;
}