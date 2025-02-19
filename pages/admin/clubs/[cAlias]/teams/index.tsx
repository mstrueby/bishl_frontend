import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import Layout from '../../../../../components/Layout';
import SectionHeader from "../../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import DataList from '../../../../../components/admin/ui/DataList';
import { ta } from "date-fns/locale";

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface TeamsProps {
  jwt: string,
  club: ClubValues,
  teams: TeamValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const jwt = getCookie('jwt', context);
    const { cAlias } = context.params as { cAlias: string };

    if (!jwt || !cAlias) {
      return {
        notFound: true
      };
    }

    let club: ClubValues | null = null;
    let teams: TeamValues[] = [];

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
    club = clubResponse.data;


    // Get teams
    const res = await axios.get(`${BASE_URL}/clubs/${cAlias}/teams/`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    teams = res.data;
    return {
      props: {
        jwt, club, teams
      },
    };
  } catch (error) {
    console.error('Error fetching data in getServerSideProps:', error);
    // Return a valid default props structure in case of error
    return {
      props: {
        jwt: '',
        club: null,
        teams: []
      }
    };
  }
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

const Teams: NextPage<TeamsProps> = ({ jwt, club, teams: initialTeams }) => {
  const [teams, setTeams] = useState<TeamValues[]>(initialTeams);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/clubs/${club.alias}/teams/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setTeams(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('TEAMS: Error fetching teams:', error);
      }
    }
  };

  const toggleActive = async (clubAlias: string, teamId: string, currentStatus: boolean, logoUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (logoUrl) {
        formData.append('logoUrl', logoUrl);
      }
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.patch(`${BASE_URL}/clubs/${clubAlias}/teams/${teamId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        // Handle successful response
        console.log(`Team ${teamId} successfully activated`);
        await fetchTeams();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the team.');
      } else {
        // Handle error response
        console.error('Failed to activate team.');
      }
    } catch (error) {
      console.error('Error activating club:', error);
    }
  };

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

  const teamValues = teams
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team: TeamValues) => ({
      ...team
    }));

  const dataLisItems = teamValues.map((team: TeamValues) => {
    return {
      _id: team._id,
      title: team.name,
      description: [team.ageGroup],
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
        { edit: { onClick: () => router.push(`/admin/clubs/${club.alias}/teams/${team.alias}/edit`) } },
        { players: { onClick: () => router.push(`/admin/clubs/${club.alias}/teams/${team.alias}/players`) } },
        { active: { onClick: () => toggleActive(club.alias, team._id, team.active, null) } },
      ],
    }
  });

  const sectionTitle = 'Mannschaften';
  const sectionDescription = club.name.toUpperCase();
  const backLink = `/admin/clubs`;
  const newLink = `/admin/clubs/${club.alias}/teams/add`;
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }


  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
        backLink={backLink}
        newLink={newLink}
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

export default Teams;