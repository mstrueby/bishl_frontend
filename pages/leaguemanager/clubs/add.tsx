import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../components/LayoutAdm';
import ClubForm from '../../../components/leaguemanager/ClubForm';
import { ClubValues } from '../../../types/ClubValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { navData } from '../../../components/leaguemanager/navData';


let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/clubs/"

interface AddProps {
  jwt: string;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: ClubValues = {
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
    logo: '',
    legacyId: '',
    teams: [],
  };;

  const onSubmit = async (values: ClubValues) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      console.log(key, value);
      formData.append(key, value);
    }

    setLoading(true);
    try {
      const response = await axios({
        method: 'POST',
        url: BASE_URL,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: '/leaguemanager/clubs',
          query: { message: `Der neue Verein ${values.name} wurde erfolgreich angelegt.` },
        }, '/leaguemanager/clubs');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Ein Fehler ist aufgetreten.';
        setError(errorMessage);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Handle the cancel button action, redirecting back to clubs listing page
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

  const formProps = {
    initialValues,
    onSubmit,
    handleCancel,
    isNew: true,
    enableReinitialize: false,
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Neuer Verein'
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <ClubForm {...formProps} />
    </LayoutAdm>
  );
};