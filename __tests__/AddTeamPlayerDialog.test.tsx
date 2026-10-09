import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTeamPlayerDialog from '@/components/admin/AddTeamPlayerDialog';
import apiClient from '@/lib/apiClient';
import { addPlayerTeamAssignment } from '@/lib/addPlayerTeamAssignment';
import type { ClubValues, TeamValues } from '@/types/ClubValues';

jest.mock('@/lib/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/lib/addPlayerTeamAssignment', () => ({ addPlayerTeamAssignment: jest.fn() }));

const club = { _id: 'club', name: 'Club' } as ClubValues;
const team = { _id: 'team', name: 'Team' } as TeamValues;
const player = { _id: 'player', firstName: 'Ada', lastName: 'Test', assignedTeams: [] };

// JSDOM has no layout observer; Headless UI uses it when closing the combobox.
beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('add team player dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [player] } });
    (addPlayerTeamAssignment as jest.Mock).mockResolvedValue(player);
  });

  async function selectPlayer() {
    const user = userEvent.setup();
    await user.type(screen.getByRole('combobox', { name: 'Spieler suchen' }), 'Ada');
    await user.click(await screen.findByRole('option', { name: 'Test, Ada' }));
    return user;
  }

  it('searches after typing, saves the selection, refreshes, and closes', async () => {
    const onAdded = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<AddTeamPlayerDialog club={club} team={team} onAdded={onAdded} onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
    expect(apiClient.get).not.toHaveBeenCalled();
    const user = await selectPlayer();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/players', expect.objectContaining({
      params: { search: 'Ada', limit: 100 },
    }));
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(addPlayerTeamAssignment).toHaveBeenCalledWith('player', club, team);
    expect(onAdded).toHaveBeenCalledWith(player);
  });

  it('cancels without saving', async () => {
    const onClose = jest.fn();
    render(<AddTeamPlayerDialog club={club} team={team} onAdded={jest.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(addPlayerTeamAssignment).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and shows save failures', async () => {
    (addPlayerTeamAssignment as jest.Mock).mockRejectedValue(new Error('Speichern fehlgeschlagen'));
    const onAdded = jest.fn();
    const onClose = jest.fn();
    render(<AddTeamPlayerDialog club={club} team={team} onAdded={onAdded} onClose={onClose} />);
    const user = await selectPlayer();
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Speichern fehlgeschlagen');
    expect(onClose).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('prevents choosing an already assigned player for a duplicate save', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [{
      ...player, assignedTeams: [{ teams: [{ teamId: team._id }] }],
    }] });
    render(<AddTeamPlayerDialog club={club} team={team} onAdded={jest.fn()} onClose={jest.fn()} />);
    await selectPlayer();
    expect(screen.getByText('Dieser Spieler ist dieser Mannschaft bereits zugeordnet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
    expect(addPlayerTeamAssignment).not.toHaveBeenCalled();
  });
});
