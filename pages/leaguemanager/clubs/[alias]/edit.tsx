// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import Image from 'next/image';
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
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key === 'logo' && typeof value === 'string') {
        // If 'logo' field is a string, assume it's the path to the existing logo and it wasn't updated:
        continue;
      }
      formData.append(key, value);
    }
    setError(null);
    try {
      const response = await axios.patch(BASE_URL + club._id, formData, { 
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/clubs',
          query: { message: `Der Verein ${values.name} wurde erfolgreich aktualisiert.` } 
        }, '/leaguemanager/clubs');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.'); 
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
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
    logo: club?.logo || '',
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

      {club?.logo && (
        <div className="mb-4">
          <Image src={club.logo} alt={club.name} width={200} height={200} objectFit="contain" />
        </div>
      )}
      
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