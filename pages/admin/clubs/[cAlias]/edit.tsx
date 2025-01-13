// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import ClubForm from '../../../../components/admin/ClubForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { ClubValues } from '../../../../types/ClubValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/clubs/';

interface EditProps {
  jwt: string,
  club: ClubValues,
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { cAlias } = context.params as { cAlias: string };

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
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
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

    // Fetch the existing club data
    let club = null;
  try {
    const response = await axios.get(BASE_URL + cAlias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    club = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching club:', error.message);
    }
  }
  return club ? { props: { jwt, club, cAlias } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, club }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: ClubValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          // Handle imageUrl specifically to ensure it's only appended if not null
          if (key === 'logoUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'logoUrl') {
            formData.append(key, value);
          }
        }
      });
      formData.delete('teams');

      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }

      const response = await axios.patch(BASE_URL + club._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      if (response.status === 200) {
        router.push({
          pathname: `/admin/clubs`,
          query: { message: `Der Verein <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/clubs`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        router.push({
          pathname: `/admin/clubs`,
          query: { message: `Keine Änderungen für Verein <strong>${values.name}</strong> vorgenommen.` }
        }, `/admin/clubs`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/clubs`);
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // Form initial values with existing club data
  const initialValues: ClubValues = {
    _id: club?._id || '',
    name: club?.name || '',
    alias: club?.alias || '',
    addressName: club?.addressName || '',
    street: club?.street || '',
    zipCode: club?.zipCode || '',
    city: club?.city || '',
    country: club?.country || '',
    email: club?.email || '',
    yearOfFoundation: club?.yearOfFoundation || '',
    description: club?.description || '',
    website: club?.website || '',
    ishdId: club?.ishdId || '',
    active: club?.active || false,
    logoUrl: club?.logoUrl || '',
    teams: club?.teams || [],
    legacyId: club?.legacyId || '',
  };

  const sectionTitle = 'Verein bearbeiten';

  // Render the form with initialValues and the edit-specific handlers
  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <ClubForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Edit;