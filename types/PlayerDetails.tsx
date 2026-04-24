import { Assignment, PlayUpTracking } from "./PlayerValues";

export interface PlayerStat {
  season?: { alias: string; name: string };
  tournament?: { alias: string; name: string };
  team?: { name: string; fullName?: string; shortName?: string; tinyName?: string };
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  penaltyMinutes?: number;
}

export interface PlayerDetails {
  stats?: PlayerStat[];
  assignedTeams?: Assignment[];
  playUpTrackings?: PlayUpTracking[];
  birthdate?: string;
  fullFaceReq?: boolean;
}
