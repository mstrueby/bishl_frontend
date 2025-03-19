
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

    return {
      _id: player._id,
      title: `${number ? number + ' - ' : ''}${name}`,
      ageGroup: {
        value: player.ageGroup + (player.overAge ? ' (OA)' : ''),
        color: player.ageGroup === team.ageGroup ? 'green' : canAlsoPlayInAgeGroup(player.ageGroup, team.ageGroup, player.overAge) ? 'yellow' : 'red'
      },
      alias: player._id,
      description: [
        `${player.assignedTeams
          .map((item) => {
            const filteredTeams = item.teams.filter((teamInner) => teamInner.teamId === team._id);
            const passNos = filteredTeams.map((teamInner) => teamInner.passNo);
            return passNos.length > 0 ? passNos.join(', ') : '';
          })
          .filter(Boolean)
          .join(', ')
        } ${player.assignedTeams.some((item) =>
          item.teams.some((teamInner) => teamInner.teamId != team._id)
        ) ? ` (${player.assignedTeams
          .map((item) => {
            const nonMatchingTeams = item.teams.filter((teamInner) => teamInner.teamId != team._id);
            const passNos = nonMatchingTeams.map((teamInner) => teamInner.passNo);
            return passNos.length > 0 ? passNos.join(', ') : '';
          })
          .filter(Boolean)
          .join(', ')})` : ''
        }`,
        `geb. ${new Date(player.birthdate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        `${player.sex === 'männlich' ? '♂' : '♀'}`,
        `${player.assignedTeams
          .map((item) => {
            const filteredTeams = item.teams.filter((teamInner) => teamInner.teamId === team._id);
            const modifyDates = filteredTeams.map((teamInner) => {
              const date = new Date(teamInner.modifyDate);
              return `mod. ${date.toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}`;
            });
            return modifyDates.length > 0 ? modifyDates.join(', ') : '';
          })
          .filter(Boolean)
          .join(', ')
        }`
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
