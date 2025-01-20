import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues, TeamValues } from '../../../../types/ClubValues';
import { PlayerValues } from '../../../../types/PlayerValues';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import DataList from '../../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface TeamProps {
  jwt: string,
  club: ClubValues,
  team: TeamValues,
  players: PlayerValues[],
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { teamAlias } = context.params as { teamAlias: string };

  let club = null;
  let team = null;
  let players = null;

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    // console.log("user:", user)
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('CLUB_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Get club by user's clubId
    const clubResponse = await axios.get(`${BASE_URL}/clubs/id/${user.club.clubId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    club = clubResponse.data;
    // console.log("club:", club)

    // Get team by alias
    const teamResponse = await axios.get(`${BASE_URL}/clubs/${club.alias}/teams/${teamAlias}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    team = teamResponse.data;
    // console.log("team:", team)

    // Get players of team by calling /players/clubs/alias/teams/alias
    const playersResponse = await axios.get(`${BASE_URL}/players/clubs/${club.alias}/teams/${teamAlias}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      }
    });
    players = playersResponse.data;
    // console.log("players:", players)

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
    }
  }


  return team ? {
    props: {
      jwt, club, team, players,
    },
  } : {
    props: { jwt }
  };
};

const transformedUrl = (id: string) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {
    //effect: {
    //  name: 'grayscale',
    //},
    //effect: {
    //  name: 'tint',
    //  value: '60:blue:white'
    //}
  }
});

const MyClub: NextPage<TeamProps> = ({ jwt, club, team, players: initialPlayers }) => {
  //const [club, setClub] = useState<ClubValues>(initialClub);
  const [players, setPlayers] = useState<PlayerValues[]>(initialPlayers);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchPlayers = async () => {
    try {
      const playersResponse = await axios.get(`${BASE_URL}/players/clubs/${club.alias}/teams/${team.alias}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      setPlayers(playersResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching players:', error);
      }
    }
  };

  const editPlayer = (teamAlias: string, PlayerId: string) => {
    router.push(`/admin/myclub/${teamAlias}/${PlayerId}`);
  }

  const toggleActive = async (playerId: string, teamId: string, assignedTeams: any, image: string | null) => {
    try {
      console.log("input assignedTeams:", assignedTeams)
      const updatedAssignedTeams = assignedTeams.map((item: any) => ({
        clubId: item.clubId,
        teams: item.teams.map((teamInner: any) => {
          const updatedTeam: any = {
            teamId: teamInner.teamId,
            passNo: teamInner.passNo,
            source: teamInner.source,
            modifyDate: teamInner.modifyDate,
          };

          //if (teamInner.jerseyNo !== undefined) {
          //  updatedTeam.jerseyNo = teamInner.jerseyNo;
          //}

          if (teamInner.teamId === teamId) {
            updatedTeam.active = !teamInner.active;
          } else if (teamInner.active !== undefined) {
            updatedTeam.active = teamInner.active;
          }

          return updatedTeam;
        })
      }));

      const formData = new FormData();
      formData.append('assignedTeams', JSON.stringify(updatedAssignedTeams));
      if (image) {
        formData.append('image', image);
      }

      // Debug FormData by logging key-value pairs to the console
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.patch(`${BASE_URL! + '/players/'}${playerId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        console.log(`Player ${playerId} status successfully toggled for team ${teamId}`);
        await fetchPlayers();
      } else if (response.status === 304) {
        console.log('No changes were made to the player status.');
      } else {
        console.error('Failed to update player status.');
      }
    } catch (error) {
      console.error('Error updating player status:', error);
    }
  }

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };


  const playerValues = Array.isArray(players)
    ? players.slice().sort((a, b) => a.firstName.localeCompare(b.firstName))
    : [];

  const dataLisItems = playerValues?.map((player: PlayerValues) => {
    return {
      _id: player._id,
      title: `${player.assignedTeams
        .flatMap(item => item.teams)
        .find(teamInner => teamInner.teamId === team._id)?.jerseyNo 
          ? `#${player.assignedTeams
              .flatMap(item => item.teams)
              .find(teamInner => teamInner.teamId === team._id)?.jerseyNo} ` 
          : ''}${player.displayFirstName} ${player.displayLastName}`,
      description: [
        /*
        `${player.firstName} ${player.lastName}`,
        new Date(player.birthdate).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        */
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
      alias: player._id,
      image: {
        src: player.imageUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png',
        width: 32,
        height: 32,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      },
      published: player.assignedTeams
        .flatMap(item => item.teams)
        .find(teamInner => teamInner.teamId === team._id)?.active || false,
      menu: [
        { edit: { onClick: () => editPlayer(team.alias, player._id) } },
        { active: { onClick: () => { toggleActive(player._id, team._id, player.assignedTeams, player.imageUrl || null) } } },
      ],
    }
  }) || [];

  const sectionTitle = team.name ? team.name : 'Meine Mannschaft';
  const description = club.name ? club.name.toUpperCase() : 'Mein Verein';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }
  const backLink = '/admin/myclub';

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={description}
        backLink={backLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
        statuses={statuses}
      />

    </Layout>
  );
};

export default MyClub;



