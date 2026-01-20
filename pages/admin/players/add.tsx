
import { useState, useEffect } from 'react'
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { PlayerValues } from '../../../types/PlayerValues';
import { ClubValues } from '../../../types/ClubValues';
import PlayerAdminForm from '../../../components/admin/PlayerAdminForm';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import ErrorMessage from '../../../components/ui/ErrorMessage';
import LoadingState from '../../../components/ui/LoadingState';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import apiClient from '../../../lib/apiClient';

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;
    
    const fetchClubs = async () => {
      try {
        const response = await apiClient.get('/clubs', {
          params: { active: true }
        });
        setClubs(response.data);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setError('Fehler beim Laden der Vereine.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchClubs();
  }, [authLoading, user]);

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
    playUpTrackings: []
  };

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
      
      const response = await apiClient.post('/players/', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/players',
          query: { message: `Spieler*in <strong>${values.firstName} ${values.lastName}</strong>  wurde erfolgreich angelegt.` },
        }, '/admin/players');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      console.error('Error adding player:', error);
      setError(error.response?.data?.detail || 'Ein Fehler ist aufgetreten.');
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

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
    return null;
  }

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

export default Add;
