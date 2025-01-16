import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues } from '../../../types/ClubValues';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface ClubsProps {
  jwt: string,
  club: ClubValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let club = null;

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
    const res = await axios.get(`${BASE_URL}/clubs/${user.club.clubId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    club = res.data;
    console.log("club:", club)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
    }
  }
  return club ? {
    props: {
      jwt, club
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

const Clubs: NextPage<ClubsProps> = ({ jwt, club: initialClub }) => {
  const [club, setClub] = useState<ClubValues>(initialClub);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchClubs = async () => {
    try {
      const res = await axios.get(BASE_URL! + '/clubs/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setClubs(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching clubs:', error);
      }
    }
  };

  const editClub = (alias: string) => {
    router.push(`/admin/clubs/${alias}/edit`);
  }

  const toggleActive = async (clubId: string, currentStatus: boolean, logo: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (logo) {
        formData.append('logo', logo);
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

  const sectionTitle = club?.name || 'Mein Verein';
  const newLink = `/admin/clubs/${club?.alias}/addTeam`;
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataLisItems = club?.teams
    ? club.teams
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => ({
          _id: team._id || '',
          title: team.name,
          description: `${team.fullName} / ${team.ageGroup}`,
          alias: team.alias,
          active: team.active,
          menu: [
            { edit: { onClick: () => router.push(`/admin/clubs/${club.alias}/teams/${team.alias}/edit`) } },
          ],
        }))
    : [];

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
      />

    </Layout>
  );
};

export default Clubs;



