import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { TeamValues } from '../../../../types/ClubValues';
import { PlayerValues } from '../../../../types/PlayerValues';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import DataList from '../../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface TeamProps {
  jwt: string,
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
    console.log("user:", user)
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
    console.log("club:", club)

    // Get team by alias
    const teamResponse = await axios.get(`${BASE_URL}/clubs/${club.alias}/teams/${teamAlias}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    team = teamResponse.data;
    console.log("team:", team)
                                         
    // Get players of team by calling /players/clubs/alias/teams/alias
    const playersResponse = await axios.get(`${BASE_URL}/players/clubs/${club.alias}/teams/${teamAlias}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      }
    });
    players = playersResponse.data;
    console.log("players:", players)
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
    }
  }

  
  return team ? {
    props: {
      jwt, team, players,
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

const MyClub: NextPage<TeamProps> = ({ jwt, team, players }) => {
  //const [club, setClub] = useState<ClubValues>(initialClub);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const editPlayer = (teamAlias: string, PlayerId: string) => {
    router.push(`/admin/myclub/${teamAlias}/${PlayerId}`);
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

  const sectionTitle = team?.name || 'Meine Mannschaft';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const playerValues = players?
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team: TeamValues) => ({
      ...team
    }));

  const dataLisItems = teamValues.map((team: TeamValues) => {
    return {
      _id: team._id,
      title: team.name,
      alias: team.alias,
      /*
      image: {
        src: transformedUrl(team.logoUrl),
        width: 32,
        height: 32,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      },
      */
      published: team.active,
      menu: [
        { edit: { onClick: () => editTeam(team.alias) } },
      ],
    }
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
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



