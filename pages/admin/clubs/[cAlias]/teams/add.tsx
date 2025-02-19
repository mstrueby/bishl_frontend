import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { ClubValues, TeamValues } from '../../../../../types/ClubValues';
import TeamForm from '../../../../../components/admin/TeamForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from "../../../../../components/admin/SectionHeader";
import ErrorMessage from '../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface AddProps {
  jwt: string;
  cAlias: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const cAlias = context.params?.cAlias as string | undefined;
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
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
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

    // Get club name
    const clubResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/clubs/${cAlias}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    club = clubResponse.data;
    console.log("club:", club)

    return { props: { jwt, cAlias } };
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

export default function Add({ jwt, cAlias}: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: TeamValues = {
    _id: '',
    name: '',
    alias: '',
    fullName: '',
    shortName: '',
    tinyName: '',
    ageGroup: '',
    teamNumber: 1,
    active: false,
    external: false,
    ishdId: '',
    legacyId: 0,
  };

  const handleCancel = () => {
    router.push(`/admin/clubs/${cAlias}/teams`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const sectionTitle = 'Neue Mannschaft';
  const sectionDescription = cAlias.toUpperCase();

  const handleSubmit = async (values: TeamValues) => {
    console.log("submitting:", values)
  };

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <TeamForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        enableReinitialize={false}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};