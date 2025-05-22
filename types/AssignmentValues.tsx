export interface AssignmentValues {
  _id: string;
  matchId: string;
  status: string;
  referee: {
    userId: string;
    firstName: string;
    lastName: string;
    clubId: string;
    clubName: string;
    logoUrl: string;
    points: number;
    level: string;
  };
  position: number;
}