import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { PlayerValues } from '../../../../../../../types/PlayerValues';
import Layout from '../../../../../../../components/Layout';
import SectionHeader from "../../../../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../../../../components/ui/SuccessMessage';
import DataList from '../../../../../../../components/admin/ui/DataList';
import { getDataListItems } from '../../../../../../../tools/playerItems';
import { ta } from "date-fns/locale";

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface PlayersProps {
  jwt: string,
  cAlias: string,
  clubName: string,
  team: {
    _id: string,
    name: string,
    alias: string,
  }  
  players: PlayerValues[],
  totalPlayers: number,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { cAlias } = context.params as { cAlias: string };
  const { tAlias } = context.params as { tAlias: string };
  let clubName = null;
  let team = {};
  let players: PlayerValues[] = [];
  let totalPlayers = 0;

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    //console.log("user:", user)
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('LEAGUE_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Get club infos
    const clubResponse = await axios.get(`${BASE_URL}/clubs/${cAlias}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    clubName = clubResponse.data.name;

    // Get team infos
    const teamResponse = await axios.get(`${BASE_URL}/clubs/${cAlias}/teams/${tAlias}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    team = {
        _id: teamResponse.data._id,
        name: teamResponse.data.name,
        alias: teamResponse.data.alias,
    };
    
    // Get players
    const res = await axios.get(`${BASE_URL}/players/clubs/${cAlias}/teams/${tAlias}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      params: {
        sortby: 'lastName',
        all: 'true'
      }
    });
    players = res.data.results;
    totalPlayers = res.data.total;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error?.response?.data.detail || 'Error fetching players.');
    }
  }
  return {
    props: {
      jwt, cAlias, clubName, team, players: players || [], totalPlayers: totalPlayers || 0
    }
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

const Players: NextPage<PlayersProps> = ({ jwt, cAlias, clubName, team, players: initialPlayers, totalPlayers }) => {
  const [players, setPlayers] = useState<PlayerValues[]>(initialPlayers);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

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

  const editPlayer = (teamAlias: string, PlayerId: string) => {
    router.push(`/admin/myclub/${teamAlias}/${PlayerId}`);
  }

  const toggleActive = async (playerId: string, teamId: string, assignedTeams: any, imageUrl: string | null) => {
    return null;
  }
  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const sectionTitle = team.name;
  const description = clubName.toUpperCase();
  const backLink = `/admin/clubs/${cAlias}/teams`;
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataLisItems = getDataListItems(players, team, editPlayer, toggleActive, false)

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
        showStatusIndicator
      />

    </Layout>
  );
};

export default Players;