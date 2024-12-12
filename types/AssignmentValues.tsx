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
    points: number;
  };
  position: number;
}