// pages/leaguemanager/venues/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import VenueForm from '../../../../components/leaguemanager/VenueForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import LmSidebar from '../../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../../components/leaguemanager/SectionHeader';
import { VenueFormValues } from '../../../../types/VenueFormValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/venues/';

interface EditProps {
  jwt: string,
  venue: VenueFormValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
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
    // Handle error (e.g., not found)
    console.error('Could not fetch the venue data');
  }

  return venue ? { props: { jwt, venue } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, venue }) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: VenueFormValues) => {
    setError(null);
    //console.log(values);
    try {
      const response = await axios.patch(BASE_URL + venue._id, values, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/venues',
          query: { message: `Die Spielfläche ${values.name} wurde erfolgreich aktualisiert.` }
        }, '/leaguemanager/venues');
      } else {
        setError('An unexpected error occurred while updating the venue.');
      }
    } catch (error) {
      setError('Failed to update the venue.');
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/venues');
  };

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  // Handler to close the success message
  const handleCloseMessage = () => {
    setError(null);
  };

  // Form initial values with existing venue data
  const initialValues: VenueFormValues = {
    _id: venue?._id || '',
    name: venue?.name || '',
    alias: venue?.alias || '',
    shortName: venue?.shortName || '',
    street: venue?.street || '',
    zipCode: venue?.zipCode || '',
    city: venue?.city || '',
    country: venue?.country || '',
    latitude: venue?.latitude !== undefined && venue?.latitude !== null ? venue.latitude : 0,
    longitude: venue?.longitude !== undefined && venue?.longitude !== null ? venue.longitude : 0,
    active: venue?.active || false,
  };

  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={`Spielfläche bearbeiten`}
    >

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <VenueForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
      />
    </LayoutAdm>
  );
};

export default Edit;