import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { buildUrl } from 'cloudinary-build-url'
import { ClubValues, TeamValues } from '../../../types/ClubValues';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';
import { ageGroupConfig } from '../../../tools/consts';
import apiClient from '../../../lib/apiClient';

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
    const userResponse = await apiClient.get('/users/me', {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    //console.log("user:", user)
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('CLUB_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Get club by user's clubId
    const res = await apiClient.get(`/clubs/id/${user.club.clubId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    club = res.data;
    //console.log("club:", club)
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

const MyClub: NextPage<ClubsProps> = ({ jwt, club: initialClub }) => {
  const [club, setClub] = useState<ClubValues>(initialClub);
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

  const sectionTitle = club?.name || 'Mein Verein';
  const sectionDescription = 'MANNSCHAFTEN';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const teamValues = club?.teams
    .slice()
    .sort((a, b) => {
      const aGroup = ageGroupConfig.find(ag => ag.key === a.ageGroup);
      const bGroup = ageGroupConfig.find(ag => ag.key === b.ageGroup);
      const sortOrderDiff = (aGroup?.sortOrder || 0) - (bGroup?.sortOrder || 0);
      return sortOrderDiff !== 0 ? sortOrderDiff : (a.teamNumber || 0) - (b.teamNumber || 0);
    })
    .map((team: TeamValues) => ({
      ...team
    }));

  const dataLisItems = teamValues.map((team: TeamValues) => {
    return {
      _id: team._id,
      title: team.name,
      description: [team.ageGroup, team.fullName],
      alias: team.alias,
      image: {
        src: team.logoUrl ? team.logoUrl : (club.logoUrl ? club.logoUrl : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.svg'),
        width: 48,
        height: 48,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      },
      published: team.active,
      menu: [
        { players: { onClick: () => router.push(`/admin/myclub/${team.alias}`) } },
      ],
    }
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
        statuses={statuses}
        showStatusIndicator
        showThumbnails
        showThumbnailsOnMobiles
      />

    </Layout>
  );
};

export default MyClub;