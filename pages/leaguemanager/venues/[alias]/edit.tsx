// pages/leaguemanager/venues/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import VenueForm from '../../../../components/leaguemanager/VenueForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import LmSidebar from '../../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../../components/leaguemanager/SectionHeader';
import { VenueFormValues } from '../index'

interface EditProps {
  jwt: string,
  venue: VenueFormValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the existing venue data
  let venue = null;
  const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/venues/';
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
    const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/venues/';

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
    _id: venue._id,
    name: venue?.name || '',
    alias: venue?.alias || '',
    shortName: venue?.shortName || '',
    street: venue?.street || '',
    zipCode: venue?.zipCode || '',
    city: venue?.city || '',
    country: venue?.country || '',
    latitude: venue?.latitude || '',
    longitude: venue?.longitude || '',
    active: venue?.active || false,
  };

  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm sidebar={<LmSidebar />}>
      <SectionHeader
        sectionData={{
          title: `Spielfläche ${initialValues.name} bearbeiten`,
        }}
      />

      {error &&
        <div className="border-l-4 border-red-400 rounded-md bg-red-50 p-4 my-4 md:mx-6 lg:mx-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={handleCloseMessage}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      }

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