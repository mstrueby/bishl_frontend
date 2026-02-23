import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import axios, { AxiosError } from "axios";
import { PlayerValues } from "../../../types/PlayerValues";
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from "../../../components/ui/SuccessMessage";
import DataList from "../../../components/admin/ui/DataList";
import apiClient from "../../../lib/apiClient";
import useAuth from "../../../hooks/useAuth";
import { UserRole } from "../../../lib/auth";
import usePermissions from "../../../hooks/usePermissions";
import LoadingState from "../../../components/ui/LoadingState";
import Pagination from "../../../components/ui/Pagination";
import SearchBox from "../../../components/ui/SearchBox";

const Players: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const router = useRouter();

  const handleSearch = async (query: string) => {  
    if (!user || !query.trim()) {
      setSearchOptions([]);
      return;
    }
    
    try {
      const res = await apiClient.get("/players", {
        params: {
          search: query,
          limit: 100, // Return up to 100 search results
        },
      });
      
      // Handle the response structure: res.data.data contains the array of players
      const playersData = res.data?.data || res.data || [];
      
      const searchResults = playersData.map((player: PlayerValues) => {
        const labelComponents = [`${player.firstName} ${player.lastName}`];
        if (
          player.displayFirstName !== player.firstName ||
          player.displayLastName !== player.lastName
        ) {
          labelComponents.push(
            `(${player.displayFirstName} ${player.displayLastName})`,
          );
        }
        return {
          id: player._id,
          label: labelComponents.join(" "),
        };
      });

      setSearchOptions(searchResults);
    } catch (error) {
      console.error("Error searching players:", error);
      setSearchOptions([]);
    }
  };

  const handleSelect = (option: { id: string; label: string }) => {
    router.push(`/admin/players/${option.id}/edit`);
  };

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
      router.push("/");
    }
  }, [authLoading, user, hasAnyRole, router]);

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
  if (authLoading) {
    return (
      <Layout>
        <SectionHeader title="Spieler" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) return null;

  const sectionTitle = "Spieler";
  const newLink = "/admin/players/add";

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
        searchBox={
          <SearchBox
            placeholder="Name, Pass-Nr."
            options={searchOptions}
            onSearch={handleSearch}
            onSelect={handleSelect}
          />
        }
      />

      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={handleCloseSuccessMessage}
        />
      )}

      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p>Nutzen Sie die Suche, um einen Spieler zu finden und zu bearbeiten.</p>
      </div>
    </Layout>
  );
};

export default Players;
