import apiClient from '@/lib/apiClient';
import { addPlayerTeamAssignment, appendPlayerTeamAssignment } from '@/lib/addPlayerTeamAssignment';
import { ClubValues, TeamType, TeamValues } from '@/types/ClubValues';
import { Assignment, AssignmentTeam, ClubType, LicenseType } from '@/types/PlayerValues';

jest.mock('@/lib/apiClient', () => ({
  __esModule: true, default: { get: jest.fn(), patch: jest.fn() },
}));

const club = { _id: 'club', name: 'Club', alias: 'club', ishdId: '10' } as ClubValues;
const team = { _id: 'team-new', name: 'Team', alias: 'team', teamType: TeamType.HOBBY, ageGroup: 'HERREN' } as TeamValues;
const existingTeam = {
  teamId: 'team-old', active: false, licenseType: LicenseType.PRIMARY, jerseyNo: 17,
  passNo: '123', adminOverride: true, overrideReason: 'Preserve',
} as AssignmentTeam;
const assignments: Assignment[] = [
  { clubId: 'other', clubType: ClubType.LOAN, teams: [{ ...existingTeam, teamId: 'other-team' }] } as Assignment,
  { clubId: club._id, clubName: 'Existing name', clubType: ClubType.DEVELOPMENT, teams: [existingTeam] } as Assignment,
];

describe('adding a single player team assignment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('appends the target team without changing existing clubs, teams, or license metadata', () => {
    const before = JSON.stringify(assignments);
    const result = appendPlayerTeamAssignment(assignments, club, team, '2026-10-09T12:00:00.000Z');
    expect(JSON.stringify(assignments)).toBe(before);
    expect(result[0]).toBe(assignments[0]);
    expect(result[1]).toEqual({
      ...assignments[1],
      teams: [existingTeam, expect.objectContaining({
        teamId: team._id, teamType: TeamType.HOBBY, teamAgeGroup: team.ageGroup,
        active: true, licenseType: LicenseType.UNKNOWN, source: 'BISHL',
      })],
    });
    expect(result[1].teams[0]).toBe(existingTeam);
  });

  it('creates the target club assignment only when it is missing', () => {
    const result = appendPlayerTeamAssignment([assignments[0]], club, team);
    expect(result[0]).toBe(assignments[0]);
    expect(result[1]).toEqual(expect.objectContaining({
      clubId: club._id, clubName: club.name, clubAlias: club.alias, clubType: ClubType.MAIN,
      teams: [expect.objectContaining({ teamId: team._id })],
    }));
  });

  it('does not duplicate or reactivate an already assigned team', () => {
    const existing = [{ ...assignments[1], teams: [{ ...existingTeam, teamId: team._id }] }];
    expect(() => appendPlayerTeamAssignment(existing, club, team)).toThrow('bereits zugeordnet');
    expect(existing[0].teams[0].active).toBe(false);
  });

  it('uses fresh assignments and PATCHes only assignedTeams as multipart data', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { _id: 'player', assignedTeams: assignments } });
    (apiClient.patch as jest.Mock).mockResolvedValue({ status: 200 });
    await addPlayerTeamAssignment('player', club, team);
    expect(apiClient.get).toHaveBeenCalledWith('/players/player');
    const [url, form] = (apiClient.patch as jest.Mock).mock.calls[0];
    expect(url).toBe('/players/player');
    expect(form).toBeInstanceOf(FormData);
    expect(Array.from(form.keys())).toEqual(['assignedTeams']);
    const saved = JSON.parse(form.get('assignedTeams'));
    expect(saved[0]).toEqual(assignments[0]);
    expect(saved[1].teams[0]).toEqual(existingTeam);
    expect(saved[1].teams[1].teamId).toBe(team._id);
  });

  it('makes no write if the fresh player already has the team', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {
      _id: 'player', assignedTeams: [{ ...assignments[1], teams: [{ ...existingTeam, teamId: team._id }] }],
    } });
    await expect(addPlayerTeamAssignment('player', club, team)).rejects.toThrow('bereits zugeordnet');
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it('makes no write if current assignments cannot be loaded', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Unavailable'));
    await expect(addPlayerTeamAssignment('player', club, team)).rejects.toThrow('Unavailable');
    expect(apiClient.patch).not.toHaveBeenCalled();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { _id: 'player', assignedTeams: 'invalid' } });
    await expect(addPlayerTeamAssignment('player', club, team)).rejects.toThrow('nicht geladen');
    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
