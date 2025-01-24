import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { PlayerValues } from '../../../types/PlayerValues';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';
import Pagination from '../../../components/ui/Pagination';
import SearchBox from '../../../components/ui/SearchBox';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface PlayersProps {
  jwt: string,
  players: PlayerValues[],
  totalPlayers: number
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let players = null;
  let totalPlayers = 0;

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
    if (!user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const page = parseInt(context.query.page as string) || 1;

    const res = await axios.get(BASE_URL! + '/players/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      params: {
        page
      }
    });
    players = res.data.results;
    totalPlayers = res.data.total;
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
      players: players || [],
      totalPlayers: totalPlayers || 0
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

const Players: NextPage<PlayersProps> = ({ jwt, players: initialPlayers, totalPlayers }) => {
  const [players, setPlayers] = useState<PlayerValues[]>(initialPlayers);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<Array<{id: string, label: string}>>([]);
  const router = useRouter();
  const currentPage = parseInt(router.query.page as string) || 1;
  
  const handleSearch = async (query: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/players/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        params: {
          q: query
        }
      });
      const searchResults = res.data.results.map((player: PlayerValues) => ({
        id: player._id,
        label: `${player.displayFirstName} ${player.displayLastName}`
      }));
      setSearchOptions(searchResults);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const handleSelect = async (option: {id: string, label: string}) => {
    try {
      const res = await axios.get(`${BASE_URL}/players/${option.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      setPlayers([res.data]);
    } catch (error) {
      console.error('Error fetching player:', error);
    }
  };

  const fetchPlayers = async (page: number) => {
    try {
      const res = await axios.get(`${BASE_URL}/players/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        params: {
          page
        }
      });
      setPlayers(res.data.results);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching players:', error);
      }
    }
  };

  const handlePageChange = async (page: number) => {
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, page }
    });
    await fetchPlayers(page);
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
      firstName: player.firstName,
      lastName: player.lastName,
      birthdate: player.birthdate,
      displayFirstName: player.displayFirstName,
      displayLastName: player.displayLastName,
      nationality: player.nationality,
      position: player.position,
      fullFaceReq: player.fullFaceReq,
      source: player.source,
      assignedTeams: player.assignedTeams,
      imageUrl: player.imageUrl,
    }));

  const sectionTitle = 'SpielerInnen';
  const newLink = '/admin/players/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataLisItems = playerValues.map((player: PlayerValues) => {
    const clubNames = player.assignedTeams?.map(team => team.clubName) || [];
    
    return {
      _id: player._id,
      title: `${player.displayFirstName} ${player.displayLastName}`,
      alias: player._id,
      description: clubNames,
      image: {
        src: player.imageUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/w_36,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1737579941/players/player.png',
        width: 46,
        height: 46,
        gravity: 'center',
        className: 'object-contain rounded-full',
        radius: 0,
      },
      menu: [
        { edit: { onClick: () => editPlayer(player._id) } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
        searchBox={
          <SearchBox
            placeholder="Search players..."
            options={searchOptions}
            onSearch={handleSearch}
            onSelect={handleSelect}
          />
        }
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
        statuses={statuses}
        showThumbnails
      />

      <div className="mt-8">
        <Pagination
          totalItems={totalPlayers}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          basePath="/admin/players"
        />
      </div>
    </Layout>
  );
};

export default Players;



