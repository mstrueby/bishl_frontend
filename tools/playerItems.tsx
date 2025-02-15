
import { PlayerValues } from '../types/PlayerValues';

export const getDataListItems = (
  players: PlayerValues[], 
  team: { _id: string; alias: string }, 
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
        `${player.assignedTeams
          .map((item) => {
            const filteredTeams = item.teams.filter((teamInner) => teamInner.teamId === team._id);
            const modifyDates = filteredTeams.map((teamInner) => {
              const date = new Date(teamInner.modifyDate);
              return date.toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            });
            return modifyDates.length > 0 ? modifyDates.join(', ') : '';
          })
          .filter(Boolean)
          .join(', ')
        }`
      ],
      image: player.imageUrl ? {
        src: player.imageUrl,
        width: 46,
        height: 46,
        gravity: 'center',
        className: 'object-contain rounded-full',
        radius: 0,
      } : undefined,
      published: player.assignedTeams
        .flatMap(item => item.teams)
        .find(teamInner => teamInner.teamId === team._id)?.active || false,
      menu: menuItems,
    };
  });
};
