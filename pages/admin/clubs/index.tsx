import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import { ClubValues } from "../../../types/ClubValues";
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from "../../../components/ui/SuccessMessage";
import DataList from "../../../components/admin/ui/DataList";
import apiClient from "../../../lib/apiClient";
import useAuth from "../../../hooks/useAuth";
import { UserRole } from "../../../lib/auth";
import usePermissions from "../../../hooks/usePermissions";
import LoadingState from "../../../components/ui/LoadingState";

const Clubs: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [clubs, setClubs] = useState<ClubValues[]>([]);
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

  // Fetch clubs function for reuse
  const fetchClubs = async () => {
    try {
      const res = await apiClient.get("/clubs");
      setClubs(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching clubs:", error);
      }
    }
  };

  // Data fetching on mount
  useEffect(() => {
    if (authLoading || !user) return;

    const loadClubs = async () => {
      await fetchClubs();
      setDataLoading(false);
    };
    loadClubs();
  }, [authLoading, user]);

  const toggleActive = async (clubId: string, currentStatus: boolean, logoUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (logoUrl) {
        formData.append('logoUrl', logoUrl);
      }
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await apiClient.patch(`/clubs/${clubId}`, formData);
      if (response.status === 200) {
        // Handle successful response
        console.log(`Club ${clubId} successfully activated`);
        await fetchClubs();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the club.');
      } else {
        // Handle error response
        console.error('Failed to activate club.');
      }
    } catch (error) {
      console.error('Error activating club:', error);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Vereine" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  const clubValues = clubs
    .slice()
    .sort((a, b) => a.name.localeCompare(b.alias))
    .map((club: ClubValues) => ({
      ...club,
    }));

  const sectionTitle = "Vereine";
  const newLink = "/admin/clubs/add";
  const statuses = {
    Published: "text-green-500 bg-green-500/20",
    Unpublished: "text-gray-500 bg-gray-800/10",
    Archived: "text-yellow-800 bg-yellow-50 ring-yellow-600/20",
  };

  const dataListItems = clubValues.map((club) => {
    return {
      _id: club._id,
      title: club.name,
      alias: club.alias,
      image: {
        src: club.logoUrl
          ? club.logoUrl
          : "https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.svg",
        width: 48,
        height: 48,
        gravity: "center",
        className: "object-contain",
        radius: 0,
      },
      published: club.active,
      menu: [
        {
          edit: {
            onClick: () => router.push(`/admin/clubs/${club.alias}/edit`),
          },
        },
        {
          teams: {
            onClick: () => router.push(`/admin/clubs/${club.alias}/teams`),
          },
        },
        {
          active: {
            onClick: () =>
              toggleActive(club._id, club.active, club.logoUrl || null),
          },
        },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader title={sectionTitle} newLink={newLink} />

      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={handleCloseSuccessMessage}
        />
      )}

      <DataList
        items={dataListItems}
        statuses={statuses}
        showThumbnails
        showStatusIndicator
      />
    </Layout>
  );
};

export default Clubs;
