import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import VenueForm from '../../../components/admin/VenueForm'
import { VenueValues } from '../../../types/VenueValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/venues/"

interface AddProps {
  jwt: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);

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

  const initialValues: VenueValues = {
    _id: '',
    name: '',
    alias: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    latitude: 0,
    longitude: 0,
    imageUrl: '',
    active: false,
  };

  const onSubmit = async (values: VenueValues) => {
    setError(null)
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
        }
      });
      if (response.status === 201) {
        router.push({
          pathname: '/admin/venues',
          query: { message: `Die neue Spielfläche <strong>${values.name}</strong> wurde erfolgreich angelegt.` }
        }, '/admin/venues');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error?.response?.data.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/venues')
  }

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const sectionTitle = 'Neue Spielfläche';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <VenueForm 
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize= {true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  )
}