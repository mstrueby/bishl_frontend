import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../components/LayoutAdm';
import TeamForm from '../../../components/leaguemanager/TeamForm';
import { TeamFormValues } from '../../../types/ClubFormValues';
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

  const initialValues: TeamFormValues = {
    name: '',
    alias: '',
    fullName: '',
    shortName: '',
    tinyName: '',
    ageGroup: '',
    teamNumber: 1,
    active: false,
    external: false,
    ishdId: '',
  };

  const onSubmit = async (values: TeamFormValues) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, value);
    }

    setLoading(true);
    try {
      const response = await axios({
        method: 'POST',
        url: BASE_URL,
        data: formData,
        headers: {
          'content-type': 'multipart/form-data',
          'Authorization': `Bearer ${jwt}`,
        }
      });
      if (response.status === 201) {
        router.push({
          pathname: '/leaguemanager/teams',
          query: {
            message: `Die neue Mannschaft ${values.fullName} (${values.name}) wurde erfolgreich angelegt.`
          },
        }, '/leaguemaanger/teams');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error?.message?.data.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/teams');
  };

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const formProps = {
    initialValues,
    onSubmit,
    handleCancel,
    enableReinitialize: false,
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Neue Mannschaft'
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <TeamForm {...formProps} />
    </LayoutAdm>
  )
};