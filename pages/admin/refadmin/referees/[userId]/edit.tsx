import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import RefereeForm from '../../../../../components/admin/RefereeForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { UserValues } from '../../../../../types/UserValues';
import { ClubValues } from '../../../../../types/ClubValues'
import ErrorMessage from '../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface EditProps {
  jwt: string,
  referee: UserValues,
  clubs: ClubValues[],
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { userId } = context.params as { userId: string };
  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  let referee = null;
  let clubs = null;
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const user = userResponse.data;
    if (!user.roles?.includes('REF_ADMIN') && !user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    // Fetch the existing referee data
    const response = await axios.get(`${BASE_URL}/users/` + userId, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    referee = response.data;
    // Fetch Clubs data
    const clubsResponse = await axios.get(`${BASE_URL}/clubs/`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        active: true
      }
    });
    clubs = clubsResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching referee:', error.message);
    }
  }
  return referee ? { props: { jwt, referee, clubs } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, referee, clubs }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit = async (values: UserValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, item));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      console.log('FormData entries:', Array.from(formData.entries()));

      const response = await axios.patch(`${BASE_URL}/users/` + referee._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        router.push({
          pathname: '/admin/refadmin/referees',
          query: { message: `Schiedsrichter <strong>${values.firstName} ${values.lastName}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/refadmin/referees`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          router.push({
            pathname: '/admin/refadmin/referees',
            query: { message: `Keine Änderungen für <strong>${values.firstName} ${values.lastName}</strong> vorgenommen.` }
          }, `/admin/refadmin/referees`);
        } else {
          setError('Ein Fehler ist aufgetreten.');
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    router.push('/admin/refadmin/referees');
  }

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const initialValues: UserValues = {
    _id: referee?._id || '',
    email: referee?.email || '',
    firstName: referee?.firstName || '',
    lastName: referee?.lastName || '',
    referee: referee?.referee || undefined,
    roles: referee?.roles || []
  };

  const sectionTitle = 'Schiedsrichter bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <RefereeForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
        clubs={clubs}
      />
    </Layout>
  );
};

export default Edit;