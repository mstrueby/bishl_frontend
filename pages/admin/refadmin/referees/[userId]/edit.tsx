// pages/leaguemanager/venues/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import RefereeForm from '../../../../../components/admin/RefereeForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { UserValues } from '../../../../../types/UserValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface EditProps {
  jwt: string,
  referee: UserValues
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
    const response = await axios.get(BASE_URL + userId, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    referee = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching referee:', error.message);
    }
  }
  return referee ? { props: { jwt, referee } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, referee }) => {
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
        } else {
          formData.append(key, value);
        }
      });
      const response = await axios.patch(BASE_URL + referee._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        router.push({
          pathname: '/admin/refadmin/referees',
          query: { message: `Der Schiedsrichter <strong>${values.firstName} ${values.lastName}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/refadmin/referees`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          router.push({
            pathname: '/admin/refadmin/referees',
            query: { message: `Keine Änderungen für den Schiedsrichter <strong>${values.firstName} ${values.lastName}</strong> vorgenommen.` }
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
    password: referee?.password || '',
    firstName: referee?.firstName || '',
    lastName: referee?.lastName || '',
    club: referee?.club || undefined,
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
      />
    </Layout>
  );
};

export default Edit;