import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { PlayerValues } from '../../../types/PlaerValues';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface PlayersProps {
  jwt: string,
  players: PlayerValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
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
        'Authorization': `Bearer ${jwt}`,
      }
    });

    const user = userResponse.data;
    //console.log("user:", user)
    if (!user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const res = await axios.get(BASE_URL! + '/players/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      }
    });
    players = res.data;
    //console.log("clubs:", clubs)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      players = [];
      console.error(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
    }
  }
  return {
    props: {
      jwt, 
      players: players || []
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

const Players: NextPage<PlayersProps> = ({ jwt, players: initialPlayers }) => {
  const [players, setPlayers] = useState<PlayerValues[]>(initialPlayers);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(BASE_URL! + '/players/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setPlayers(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching players:', error);
      }
    }
  };

  const editPlayer = (id: string) => {
    router.push(`/admin/players/${id}/edit`);
  }
/*
  const toggleActive = async (clubId: string, currentStatus: boolean, logoUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (logoUrl) {
        formData.append('logoUrl', logoUrl);
      }
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.patch(`${BASE_URL! + '/clubs/'}${clubId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        // Handle successful response
        console.log(`Club ${clubId} successfully activated`);
        await fetchClubs();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the club.');
      } else {
        // Handle error response
        console.error('Failed to publish club.');
      }
    } catch (error) {
      console.error('Error publishing club:', error);
    }
  }
*/
  
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

  const playerValues = players
    .slice()
    //.sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map((player: PlayerValues) => ({
      _id: player._id,
      displayFirstName: player.displayFirstName,
      displayLastName: player.displayLastName,
    }));

  const sectionTitle = 'SpielerInnen';
  const newLink = '/admin/players/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataLisItems = playerValues.map((player: PlayerValues) => {
    return {
      _id: player._id,
      title: `${player.displayFirstName} ${player.displayLastName}`,
      alias: player._id,
      image: {
        src: player.imageUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/w_36,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1737579941/players/player.png',
        width: 46,
        height: 46,
        gravity: 'center',
        className: 'object-contain rounded-full',
        radius: 0,
      },
      //published: club.active,
      menu: [
        { edit: { onClick: () => editPlayer(player._id) } },
        //{ active: { onClick: () => toggleActive(club._id, club.active, club.logoUrl || null) } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
        statuses={statuses}
        showThumbnails
      />

    </Layout>
  );
};

export default Players;



