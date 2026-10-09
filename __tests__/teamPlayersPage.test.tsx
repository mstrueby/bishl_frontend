import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Players from '@/pages/admin/clubs/[cAlias]/teams/[tAlias]/players';
import apiClient from '@/lib/apiClient';
import { addPlayerTeamAssignment } from '@/lib/addPlayerTeamAssignment';
import { getDataListItems } from '@/tools/playerItems';

const mockRouter = {
  query: { cAlias: 'club', tAlias: 'team' },
  push: jest.fn(),
  replace: jest.fn(),
};
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/hooks/useAuth', () => {
  const user = { _id: 'admin', roles: ['ADMIN'] };
  return { __esModule: true, default: () => ({ user, loading: false }) };
});
jest.mock('@/hooks/usePermissions', () => {
  const hasAnyRole = () => true;
  return { __esModule: true, default: () => ({ hasAnyRole }) };
});
jest.mock('@/components/Layout', () => ({
  __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/admin/ui/DataList', () => ({ __esModule: true, default: () => <div>Spielerliste</div> }));
jest.mock('@/tools/playerItems', () => ({ getDataListItems: jest.fn(() => []) }));
jest.mock('@/lib/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/lib/addPlayerTeamAssignment', () => ({ addPlayerTeamAssignment: jest.fn() }));

beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it('opens the add dialog next to Zurück and reloads the team player list after saving', async () => {
  const user = userEvent.setup();
  const player = { _id: 'player', firstName: 'Ada', lastName: 'Test', assignedTeams: [] };
  const team = { _id: 'team-id', name: 'Team', alias: 'team' };
  const club = { _id: 'club-id', name: 'Club', alias: 'club' };
  let listRequests = 0;
  (apiClient.get as jest.Mock).mockImplementation(async (url: string) => {
    if (url === '/clubs/club') return { data: club };
    if (url === '/clubs/club/teams/team') return { data: team };
    if (url === '/players') return { data: { data: [player] } };
    if (url === '/players/clubs/club/teams/team') {
      listRequests++;
      return { data: { results: listRequests === 1 ? [] : [player], total: listRequests === 1 ? 0 : 1 } };
    }
    throw new Error(`Unexpected request ${url}`);
  });
  (addPlayerTeamAssignment as jest.Mock).mockResolvedValue(player);
  render(<Players />);
  const addButton = await screen.findByRole('button', { name: 'Hinzufügen' });
  expect(screen.getByRole('button', { name: 'Zurück' }).nextElementSibling).toBe(addButton);
  await user.click(addButton);
  await user.type(screen.getByRole('combobox', { name: 'Spieler suchen' }), 'Ada');
  await user.click(await screen.findByRole('option', { name: 'Test, Ada' }));
  await user.click(screen.getByRole('dialog').querySelector('button[type="submit"]')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(addPlayerTeamAssignment).toHaveBeenCalledWith('player', club, team);
  expect(listRequests).toBe(2);
  expect(getDataListItems).toHaveBeenLastCalledWith([player], team, expect.any(Function), expect.any(Function), false);
});
