
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import RefereeForm from '../../../../../components/admin/RefereeForm';
import Layout from '../../../../../components/Layout';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { UserValues } from '../../../../../types/UserValues';
import { ClubValues } from '../../../../../types/ClubValues';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../lib/auth';
import apiClient from '../../../../../lib/apiClient';
import axios from 'axios';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [referee, setReferee] = useState<UserValues | null>(null);
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const router = useRouter();
  const { userId } = router.query;

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // 2. Data fetching
  useEffect(() => {
    if (authLoading || !user || !userId) return;
    
    const fetchData = async () => {
      try {
        // Fetch referee data
        const refereeResponse = await apiClient.get(`/users/${userId}`);
        setReferee(refereeResponse.data);

        // Fetch clubs data
        const clubsResponse = await apiClient.get('/clubs', {
          params: { active: true }
        });
        setClubs(clubsResponse.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching data:', error.message);
          router.push('/admin/refadmin/referees');
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, userId, router]);

  const onSubmit = async (values: UserValues) => {
    if (!referee) return;
    
    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, item));
        } else if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      console.log('FormData entries:', Array.from(formData.entries()));

      const response = await apiClient.patch(`/users/${referee._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: '/admin/refadmin/referees',
          query: { message: `Schiedsrichter <strong>${values.firstName} ${values.lastName}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/refadmin/referees`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          router.push({
            pathname: '/admin/refadmin/referees',
            query: { message: `Keine Änderungen für <strong>${values.firstName} ${values.lastName}</strong> vorgenommen.` }
          }, `/admin/refadmin/referees`);
        } else {
          setError('Ein Fehler ist aufgetreten.');
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/refadmin/referees');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // 3. Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // 4. Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  if (!referee) {
    return <Layout><LoadingState /></Layout>;
  }

  const initialValues: UserValues = {
    _id: referee._id,
    email: referee.email,
    firstName: referee.firstName,
    lastName: referee.lastName,
    referee: referee.referee || undefined,
    roles: referee.roles
  };

  const sectionTitle = 'Schiedsrichter bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <RefereeForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
        clubs={clubs}
      />
    </Layout>
  );
};

export default Edit;
