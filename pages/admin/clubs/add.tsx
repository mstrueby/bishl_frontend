import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { ClubValues } from '../../../types/ClubValues';
import ClubForm from '../../../components/admin/ClubForm';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/clubs/"

interface AddProps {
  jwt: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;

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

    return { props: { jwt } };
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: ClubValues = {
    _id: '',
    name: '',
    alias: '',
    addressName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    email: '',
    yearOfFoundation: '',
    description: '',
    website: '',
    ishdId: '',
    active: false,
    logoUrl: '',
    legacyId: '',
    teams: [],
  };;

  const onSubmit = async (values: ClubValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      const response = await axios.post(BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: '/admin/clubs',
          query: { message: `Der neue Verein ${values.name} wurde erfolgreich angelegt.` },
        }, '/admin/clubs');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/clubs');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const sectionTitle = 'Neuer Verein';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <ClubForm 
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize= {false}
        handleCancel= {handleCancel}
        loading={loading}
      />
    </Layout>
  );
};