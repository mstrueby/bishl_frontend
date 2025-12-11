import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import TeamForm from '../../../../../../components/admin/TeamForm';
import Layout from '../../../../../../components/Layout';
import SectionHeader from '../../../../../../components/admin/SectionHeader';
import { ClubValues, TeamValues } from '../../../../../../types/ClubValues';
import ErrorMessage from '../../../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../../../components/ui/LoadingState';
import useAuth from '../../../../../../hooks/useAuth';
import usePermissions from '../../../../../../hooks/usePermissions';
import { UserRole } from '../../../../../../lib/auth';
import apiClient from '../../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../../lib/errorHandler';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [club, setClub] = useState<ClubValues | null>(null);
  const [team, setTeam] = useState<TeamValues | null>(null);
  const router = useRouter();
  const { cAlias, tAlias } = router.query;

  // 1. Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasRole(UserRole.ADMIN)) {
      router.push('/');
    }
  }, [authLoading, user, hasRole, router]);

  // 2. Data fetching
  useEffect(() => {
    if (authLoading || !user || !cAlias || !tAlias) return;

    const fetchData = async () => {
      try {
        // Fetch club data
        const clubResponse = await apiClient.get(`/clubs/${cAlias}`);
        setClub(clubResponse.data);

        // Fetch team data
        const teamResponse = await apiClient.get(`/clubs/${cAlias}/teams/${tAlias}`);
        setTeam(teamResponse.data);
      } catch (error) {
        console.error('Error fetching data:', getErrorMessage(error));
        setError(getErrorMessage(error));
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, cAlias, tAlias, router]);

  // Handler for form submission
  const onSubmit = async (values: TeamValues) => {
    if (!club || !team) return;

    setError(null);
    setLoading(true);
    console.log('submitted values', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          // Handle imageUrl specifically to ensure it's only appended if not null
          if (key === 'logoUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'logoUrl') {
            formData.append(key, value);
          }
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }

      const response = await apiClient.patch(`/clubs/${club.alias}/teams/${team._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: `/admin/clubs/${club.alias}/teams/`,
          query: { message: `Mannschaft <strong>${values.name}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/clubs/${club.alias}/teams/`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      console.error('Error updating team:', getErrorMessage(error));
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (club) {
      router.push(`/admin/clubs/${club.alias}/teams/`);
    }
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
  if (!hasRole(UserRole.ADMIN)) return null;

  if (!team || !club) {
    return <Layout><LoadingState /></Layout>;
  }

  // Form initial values with existing team data
  const initialValues: TeamValues = {
    _id: team._id,
    name: team.name,
    alias: team.alias,
    fullName: team.fullName,
    shortName: team.shortName,
    tinyName: team.tinyName,
    ageGroup: team.ageGroup,
    teamNumber: team.teamNumber,
    active: team.active,
    external: team.external,
    logoUrl: team.logoUrl,
    ishdId: team.ishdId
  };

  const sectionTitle = 'Mannschaft bearbeiten';
  const sectionDescription = club.name.toUpperCase();

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        description={sectionDescription}
      />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <TeamForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Edit;