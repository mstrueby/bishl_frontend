import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../components/LayoutAdm';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import VenueForm from '../../../components/leaguemanager/VenueForm'
import { VenueFormValues } from '../../../types/VenueFormValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { navData } from '../../../components/leaguemanager/navData';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/venues/"

interface AddProps {
  jwt: string
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: VenueFormValues = {
    name: '',
    alias: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    latitude: '',
    longitude: '',
    active: false,
  };
 
  const onSubmit = async (values: VenueFormValues) => {
    setLoading(true);
    try {
      const response = await axios({
        method: 'post',
        url: BASE_URL,
        data: JSON.stringify(values),
        headers: {
          //'Content-Type': 'multipart/form-data',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) { // Assuming status 201 means created
        router.push({
          pathname: '/leaguemanager/venues',
          query: { message: `Die neue Spielfläche ${values.name} wurde erfolgreich angelegt.` }
        }, '/leaguemanager/venues');
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
    router.push('/leaguemanager/venues')
  }

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
  };
  
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Neue Spielfläche'
    >
      {error && <ErrorMessage err={error} onClose={handleCloseMessage} /> }
      <VenueForm {...formProps} />
    </LayoutAdm>
  )
}