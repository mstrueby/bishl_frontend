
import { useState, useEffect } from "react";
import React from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { UserValues, RefereeValues } from '../../../../types/UserValues';
import Layout from "../../../../components/Layout";
import SectionHeader from "../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import { refereeLevels } from '../../../../tools/consts'
import DataList from '../../../../components/admin/ui/DataList';
import apiClient from "../../../../lib/apiClient";
import useAuth from "../../../../hooks/useAuth";
import { UserRole } from "../../../../lib/auth";
import usePermissions from "../../../../hooks/usePermissions";
import LoadingState from "../../../../components/ui/LoadingState";

const Referees: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [referees, setReferees] = useState<UserValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) {
      router.push("/");
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Fetch referees function for reuse
  const fetchReferees = async () => {
    try {
      const res = await apiClient.get("/users/referees");
      setReferees(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching referees:', error);
      }
    }
  };

  // Data fetching on mount
  useEffect(() => {
    if (authLoading || !user) return;

    const loadReferees = async () => {
      await fetchReferees();
      setDataLoading(false);
    };
    loadReferees();
  }, [authLoading, user]);

  const editReferee = (id: string) => {
    router.push(`/admin/refadmin/referees/${id}/edit`);
  };

  const toggleActive = async (refereeId: string, refereeDoc: RefereeValues | undefined) => {
    try {
      const updatedRefereeDoc = {
        ...refereeDoc,
        active: refereeDoc ? !refereeDoc.active : false,
      };
      const formData = new FormData();
      formData.append('referee', JSON.stringify(updatedRefereeDoc));
      //console.log(updatedRefereeDoc)
      
      const response = await apiClient.patch(`/users/${refereeId}`, formData);

      if (response.status === 200) {
        console.log(`Referee ${refereeId} active status updated successfully.`);
        await fetchReferees();
      } else if (response.status === 304) {
        console.log('No changes were made to the referee.');
      } else {
        console.error('Failed to update referee active status.');
      }
    } catch (error) {
      console.error('Error updating referee active status:', error);
    }
  }

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

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Schiedsrichter" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  const sectionTitle = 'Schiedsrichter';
  const newLink = '/admin/refadmin/referees/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
  }
  const categories = Object.fromEntries(
    Object.entries(refereeLevels).map(([key, value]) => [
      key, 
      `${value.background} ${value.text} ${value.ring} ${value.dot}`
    ])
  );

  const dataListItems = [...referees]
    .sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map((referee) => {
    return {
      _id: referee._id,
      title: `${referee.firstName} ${referee.lastName}`,
      alias: referee._id,
      description: [
        referee.referee?.club?.clubName || 'Kein Verein',
        referee.referee?.passNo ? `${referee.referee?.passNo}` : ''
      ].filter(Boolean),
      category: referee.referee?.level !== undefined && referee.referee.level !== "n/a" ? referee.referee.level : undefined,
      count: referee.referee?.points,
      image: undefined,
      published: referee.referee?.active,
      featured: false,
      menu: [
        { edit: { onClick: () => editReferee(referee._id) } },
        { active: { onClick: () => { toggleActive(referee._id, referee.referee) } } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        //newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

      <DataList
        items={dataListItems}
        categories={categories}
        statuses={statuses}
        showThumbnails={false}
        showStatusIndicator
      />
    </Layout>
  )
};

export default Referees;
