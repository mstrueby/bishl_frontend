import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { PlayerValues } from '../../../types/PlayerValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../tools/dateUtils';
import DataList from '../../../components/admin/ui/DataList';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const Players: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [players, setPlayers] = useState<PlayerValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchPlayers = async () => {
      try {
        const res = await apiClient.get('/players');
        setPlayers(res.data || []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching players:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };
    fetchPlayers();
  }, [authLoading, user]);

  const fetchPlayers = async () => {
    try {
      const res = await apiClient.get('/players');
      setPlayers(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching players:', error);
      }
    }
  };

  const editPlayer = (playerId: string) => {
    router.push(`/admin/players/${playerId}/edit`);
  };

  const deletePlayer = async (playerId: string) => {
    if (!playerId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true');

      const response = await apiClient.patch(`/players/${playerId}`, formData);

      if (response.status === 200) {
        console.log(`Player ${playerId} successfully deleted.`);
        await fetchPlayers();
      } else if (response.status === 304) {
        console.log('No changes were made to the player.');
      } else {
        console.error('Failed to delete player.');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Spieler" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  const player_values = players
    .slice()
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((player: PlayerValues) => ({
      _id: player._id,
      firstName: player.firstName,
      lastName: player.lastName,
      number: player.number,
      team: player.team ? player.team.name : '-',
      createUser: player.createUser?.firstName + ' ' + player.createUser?.lastName,
      createDate: new Date(new Date(player.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: player.updateUser ? (player.updateUser.firstName + ' ' + player.updateUser.lastName) : '-',
      updateDate: new Date(new Date(player.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
    }));

  const sectionTitle = 'Spieler';
  const newLink = '/admin/players/add';

  const dataListItems = player_values.map((player) => {
    return {
      _id: player._id,
      title: `${player.firstName} ${player.lastName} (#${player.number})`,
      alias: player._id,
      description: [player.team, getFuzzyDate(player.updateDate)],
      menu: [
        { edit: { onClick: () => editPlayer(player._id) } },
        { delete: { onClick: () => {} } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataListItems}
        onDeleteConfirm={deletePlayer}
        deleteModalTitle="Spieler löschen"
        deleteModalDescription="Möchtest du den Spieler <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
      />
    </Layout>
  );
}

export default Players;