
import { PlayerValues } from '../types/PlayerValues';
import { TeamValues } from '../types/ClubValues';

export const getDataListItems = (
  players: PlayerValues[],
  team: TeamValues,
  editPlayer: (teamAlias: string, playerId: string) => void,
  toggleActive: (playerId: string, teamId: string, assignedTeams: any, imageUrl: string | null) => void,
  showMenuActions = true
) => {
  return players.map((player: PlayerValues) => {
    const name = `${player.lastName}, ${player.firstName}`;
    
    const menuItems = showMenuActions ? [
      { edit: { onClick: () => editPlayer(team.alias, player._id) } },
      { active: { onClick: () => { toggleActive(player._id, team._id, player.assignedTeams, player.imageUrl || null) } } },
    ] : [];

    const licenseType = player.assignedTeams
      .flatMap(item => item.teams)
      .find(teamInner => teamInner.teamId === team._id)?.licenseType || 'N/A';

    const teamAssignment = player.assignedTeams
      .flatMap((item) => item.teams)
      .find((teamInner) => teamInner.teamId === team._id);

    return {
      _id: player._id,
      title: `${teamAssignment?.jerseyNo ? teamAssignment.jerseyNo + ' - ' : ''}${name}`,
      category: licenseType.toUpperCase(),
      alias: player._id,
      description: [
        player.ageGroup,
        teamAssignment?.passNo || "-",
        `geb. ${new Date(player.birthdate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        `${player.sex === 'männlich' ? '♂' : '♀'}`
      ],
      image: {
        src: player.imageUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/w_36,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1737579941/players/player.png',
        width: 46,
        height: 46,
        gravity: 'center',
        className: 'object-contain rounded-full',
        radius: 0,
      },
      published: teamAssignment?.active ? teamAssignment.active : false,
      valid: teamAssignment?.status === 'valid',
      menu: menuItems,
    };
  });
};
