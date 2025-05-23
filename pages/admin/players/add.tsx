import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { PlayerValues } from '../../../types/PlayerValues';
import { ClubValues } from '../../../types/ClubValues';
import PlayerAdminForm from '../../../components/admin/PlayerAdminForm';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface AddProps {
  jwt: string;
  clubs: ClubValues[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let clubs: ClubValues[] = [];
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    if (!user.roles?.some((role: string) => ['ADMIN', 'LEAGUE_ADMIN'].includes(role))) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Get clubs
    const clubsResponse = await axios.get(`${BASE_URL}/clubs`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      params: {
        active: true
      }
    });
    clubs = clubsResponse.data;

    return { props: { jwt, clubs } };
  } catch (error) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
}

export default function Add({ jwt, clubs }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: PlayerValues = {
    _id: '',
    firstName: '',
    lastName: '',
    birthdate: '',
    displayFirstName: '',
    displayLastName: '',
    nationality: '',
    fullFaceReq: false,
    managedByISHD: false,
    assignedTeams: [],
    imageUrl: '',
    imageVisible: false,
    source: 'BISHL',
    sex: 'männlich',
    ageGroup: '',
    overAge: false,
  };;

  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    values.displayFirstName = values.firstName;
    values.displayLastName = values.lastName;
    values.birthdate = new Date(values.birthdate).toISOString();
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (typeof value === 'object' && key !== 'imageUrl') {
          if (key === 'assignedTeams') {
            const cleanedTeams = value.map((club: { teams: { jerseyNo: number | null, [key: string]: any }[] }) => ({
              ...club,
              teams: club.teams.map(team => {
                if (team.jerseyNo === null) {
                  const { jerseyNo, ...restTeam } = team;
                  return restTeam;
                }
                return team;
              })
            }));
            formData.append(key, JSON.stringify(cleanedTeams));
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          if (key === 'imageUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'imageUrl') {
            formData.append(key, value);
          }
        }
      });

      console.log('FormData entries:', Array.from(formData.entries()));
      
      const response = await axios.post(`${BASE_URL}/players/`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) {
        router.push({
          pathname: '/admin/players',
          query: { message: `Spieler*in <strong>${values.firstName} ${values.lastName}</strong>  wurde erfolgreich angelegt.` },
        }, '/admin/players');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/players');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const sectionTitle = 'Spieler*in anlegen';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <PlayerAdminForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={false}
        handleCancel={handleCancel}
        loading={loading}
        clubs={clubs}
      />
    </Layout>
  );
};