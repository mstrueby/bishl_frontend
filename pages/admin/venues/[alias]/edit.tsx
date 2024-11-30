// pages/leaguemanager/venues/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import VenueForm from '../../../../components/leaguemanager/VenueForm';
import Layout from '../../../../components/Layout';
import SectionHeader from '../../../../components/admin/SectionHeader';
import { VenueValues } from '../../../../types/VenueValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/venues/';

interface EditProps {
  jwt: string,
  venue: VenueValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { alias } = context.params as { alias: string };

  // Fetch the existing venue data
  let venue = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    venue = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching venue:', error.message);
    }
  }
  return venue ? { props: { jwt, venue } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, venue }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: VenueValues) => {
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
          if (key === 'imageUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'imageUrl') {
            formData.append(key, value);
          }
        }
      });

      // Debug FormData by logging key-value pairs to the console
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await axios.patch(BASE_URL + venue._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        router.push({
          pathname: '/admin/venues',
          query: { message: `Die Spjielfläche <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/venues`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          // Handle when a 304 status is caught by error
          router.push({
            pathname: '/admin/venues',
            query: { message: `Keine Änderungen für Spielfläche <strong>${values.name}</strong> vorgenommen.` }
          }, `/admin/venues`);
        } else {
          setError('Ein Fehler ist aufgetreten.');
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/venues');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // Form initial values with existing venue data
  const initialValues: VenueValues = {
    _id: venue?._id || '',
    name: venue?.name || '',
    alias: venue?.alias || '',
    imageUrl: venue?.imageUrl || '',
    shortName: venue?.shortName || '',
    street: venue?.street || '',
    zipCode: venue?.zipCode || '',
    city: venue?.city || '',
    country: venue?.country || '',
    latitude: venue?.latitude !== undefined && venue?.latitude !== null ? venue.latitude : 0,
    longitude: venue?.longitude !== undefined && venue?.longitude !== null ? venue.longitude : 0,
    active: venue?.active || false,
  };

  const sectionTitle = 'Spielfläche bearbeiten';

  // Render the form with initialValues and the edit-specific handlers
  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <VenueForm
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