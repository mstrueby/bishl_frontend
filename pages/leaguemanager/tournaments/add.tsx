import React, { Fragment, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import LayoutAdm from '../../../components/LayoutAdm';
import { navData } from '../../../components/leaguemanager/navData';
import TournamentForm from '../../../components/leaguemanager/TournamentForm'
import { TournamentFormValues } from '../../types/TournamentFormValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/tournaments/"

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

  const initialValues: TournamentFormValues = {
    name: '',
    alias: '',
    tinyName: '',
    ageGroup: '',
    published: false,
    active: false,
    external: false,
    website: '',
    seasons: [],
    legacyId: 0,
  };

  const onSubmit = async (values: TournamentFormValues) => {
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
          pathname: '/leaguemanager/tournaments',
          query: { message: `Der neue Wettbewerb ${values.name} wurde erfolgreich angelegt.` }
        }, '/leaguemanager/tournaments');
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
    router.push('/leaguemanager/tournaments')
  }

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessaage = () => {
    setError(null);
  }

  const formProps = {
    initialValues,
    onSubmit,
    handleCancel,
    enableReinitialize: false,
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Neuer Wettbewerb'
    >
      {error && <ErrorMessage error={error} onClose={handleCloseMessaage} />}
      <TournamentForm {...formProps} />
    </LayoutAdm>
  )
  
}
