import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { TeamValues } from '../../../../../types/ClubValues';
import Layout from '../../../../../components/Layout';
import SectionHeader from "../../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import DataList from '../../../../../components/admin/ui/DataList';
import { ta } from "date-fns/locale";

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface TeamsProps {
  jwt: string,
  cAlias: string,
  clubName: string,
  teams:TeamValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { cAlias } = context.params as { cAlias: string };
  let clubName = null;
  let teams: TeamValues[] = [];

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
    

    // Get teams
    const res = await axios.get(`${BASE_URL}/clubs/${cAlias}/teams`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    teams = res.data;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error?.response?.data.detail || 'Error fetching teams.');
    }
  }
  return teams ? {
    props: {
      jwt, cAlias, clubName, teams
    },
  } : {
    props: { jwt, cAlias, clubName, teams: [] }
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

const Teams: NextPage<TeamsProps> = ({ jwt, cAlias, clubName, teams: initialTeams }) => {
  const [teams, setTeams] = useState<TeamValues[]>(initialTeams);
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
        //{ edit: { onClick: () => router.push(`/admin/clubs/${cAlias}/teams/${team.alias}/edit`) }},
        { players: { onClick: () => router.push(`/admin/clubs/${cAlias}/teams/${team.alias}/players`) } },
      ],
    }
  });

  const sectionTitle = 'Mannschaften';
  const sectionDescription = clubName.toUpperCase();
  const backLink = `/admin/clubs`;
  const newLink = `/admin/clubs/${cAlias}/teams/add`;
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