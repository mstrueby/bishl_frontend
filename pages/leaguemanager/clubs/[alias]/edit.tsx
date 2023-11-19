// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import ClubForm from '../../../../components/leaguemanager/ClubForm'; 
import LayoutAdm from '../../../../components/LayoutAdm';
import LmSidebar from '../../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../../components/leaguemanager/SectionHeader';
import { ClubFormValues } from '../../../../types/ClubFormValues'; 
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/clubs/';

interface EditProps {
  jwt: string,
  club: ClubFormValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the existing club data
  let club = null; 
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    club = response.data;
  } catch (error) {
    // Handle error (e.g., not found)
    console.error('Could not fetch the club data');
  }

  return club ? { props: { jwt, club } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, club }) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: ClubFormValues) => { 
    setError(null);
    //console.log(values);
    try {
      const response = await axios.patch(BASE_URL + club._id, values, { 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/clubs',
          query: { message: `Der Verein ${values.name} wurde erfolgreich aktualisiert.` } 
        }, '/leaguemanager/clubs');
      } else {
        setError('An unexpected error occurred while updating the club.'); 
      }
    } catch (error) {
      setError('Failed to update the club.');
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/clubs'); 
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

  // Form initial values with existing club data
  const initialValues: ClubFormValues = { 
    name: club?.name || '',
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
  };

  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm sidebar={<LmSidebar />}>
      <SectionHeader
        sectionData={{
          title: `Verein ${initialValues.name} bearbeiten`, 
        }}
      />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} /> }

      <ClubForm 
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
      />
    </LayoutAdm>
  );
};

export default Edit;