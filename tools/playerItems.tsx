
import { PlayerValues } from '../types/PlayerValues';
import { TeamValues } from '../types/ClubValues';
import { canAlsoPlayInAgeGroup, getAgeGroupRules } from './consts';

export const getDataListItems = (
  players: PlayerValues[],
  team: TeamValues,
  editPlayer: (teamAlias: string, playerId: string) => void,
  toggleActive: (playerId: string, teamId: string, assignedTeams: any, imageUrl: string | null) => void,
  showMenuActions = true
) => {
  return players.map((player: PlayerValues) => {
    const name = `${player.lastName}, ${player.firstName}`;
    const number = player.assignedTeams
      .flatMap(item => item.teams)
      .filter(teamInner => teamInner.teamId === team._id && teamInner.jerseyNo !== undefined)
      .map(teamInner => teamInner.jerseyNo)
      .join('');

    const menuItems = showMenuActions ? [
      { edit: { onClick: () => editPlayer(team.alias, player._id) } },
      { active: { onClick: () => { toggleActive(player._id, team._id, player.assignedTeams, player.imageUrl || null) } } },
    ] : [];

    const licenceTypeBadgeColors: Record<string, string> = {
      PRIMARY: "bg-green-50 text-green-700 ring-green-600/20",
      SECONDARY: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      OVERAGE: "bg-pink-50 text-pink-700 ring-pink-600/20",
      LOAN: "bg-blue-50 text-blue-700 ring-blue-600/20",
      DEVELOPMENT: "bg-purple-50 text-purple-700 ring-purple-600/20",
      SPECIAL: "bg-red-50 text-red-700 ring-red-600/20",
    };

    const licenseType = player.assignedTeams
      .flatMap(item => item.teams)
      .find(teamInner => teamInner.teamId === team._id)?.licenseType || 'N/A';

    return {
      _id: player._id,
      title: `${number ? number + ' - ' : ''}${name}`,
      badge: {
        value: licenseType,
        className: licenceTypeBadgeColors[licenseType] || 'bg-gray-50 text-gray-700 ring-gray-600/20'
      },
      alias: player._id,
      description: [
        player.ageGroup + (player.overAge && player.ageGroup !== team.ageGroup ? ' (OA)' : ''),
        `${player.assignedTeams
          .map((item) => {
            const filteredTeams = item.teams.filter((teamInner) => teamInner.teamId === team._id);
            const passNos = filteredTeams.map((teamInner) => teamInner.passNo);
            return passNos.length > 0 ? passNos.join(', ') : '';
          })
          .filter(Boolean)
          .join(', ')
        }`,
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
      published: player.assignedTeams
        .flatMap(item => item.teams)
        .find(teamInner => teamInner.teamId === team._id)?.active || false,
      menu: menuItems,
    };
  });
};
