import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import axios from "axios";
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
  const [players, setPlayers] = useState<PlayerValues[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchOptions, setSearchOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const router = useRouter();
  const currentPage = parseInt(router.query.page as string) || 1;

  const fetchPlayers = async (page: number) => {
    if (!user) return;
    
    try {
      setDataLoading(true);
      const res = await apiClient.get("/players", {
        params: {
          page,
          limit: 25,
          sortby: 'firstName'
        }
      });
      setPlayers(res.data || []);
      setTotalPlayers(res.pagination?.total_items || 0);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching players:", error);
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = async (query: string) => {  
    if (!user || !query.trim()) {
      setSearchOptions([]);
      return;
    }
    
    try {
      const res = await apiClient.get("/players", {
        params: {
          q: query,
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

  const handlePageChange = async (page: number) => {
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, page },
    }, undefined, { shallow: true });
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

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) {
      router.push("/");
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Fetch players when page changes or user loads
  useEffect(() => {
    if (authLoading || !user) return;
    
    fetchPlayers(currentPage);
  }, [authLoading, user, currentPage]);

  const editPlayer = (playerId: string) => {
    router.push(`/admin/players/${playerId}/edit`);
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
        <SectionHeader title="Spieler" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_MANAGER])) return null;

  const playerValues = players
    .slice()
    //.sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map((player: PlayerValues) => ({
      _id: player._id,
      firstName: player.firstName,
      lastName: player.lastName,
      birthdate: player.birthdate,
      displayFirstName: player.displayFirstName,
      displayLastName: player.displayLastName,
      nationality: player.nationality,
      position: player.position,
      fullFaceReq: player.fullFaceReq,
      source: player.source,
      assignedTeams: player.assignedTeams,
      imageUrl: player.imageUrl,
      imageVisible: player.imageVisible,
      ageGroup: player.ageGroup,
      overAge: player.overAge,
      sex: player.sex,
    }));

  const sectionTitle = "Spieler";
  const newLink = "/admin/players/add";
  const statuses = {
    Published: "text-green-500 bg-green-500/20",
    Unpublished: "text-gray-500 bg-gray-800/10",
    Archived: "text-yellow-800 bg-yellow-50 ring-yellow-600/20",
  };

  const dataListItems = playerValues.map((player: PlayerValues) => {
    const clubNames = player.assignedTeams?.map((team) => team.clubName) || [];

    return {
      _id: player._id,
      title: `${player.firstName} ${player.lastName}`,
      alias: player._id,
      description: clubNames,
      image: {
        src:
          player.imageUrl ||
          "https://res.cloudinary.com/dajtykxvp/image/upload/w_36,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1737579941/players/player.png",
        width: 46,
        height: 46,
        gravity: "center",
        className: "object-contain rounded-full",
        radius: 0,
      },
      menu: [{ edit: { onClick: () => editPlayer(player._id) } }],
    };
  });

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

      <div className="text-sm text-gray-600 my-4">
        {`${(currentPage - 1) * 25 + 1}-${Math.min(currentPage * 25, totalPlayers)} von ${totalPlayers} insgesamt`}
      </div>

      <DataList
        items={dataListItems}
        statuses={statuses}
        showThumbnails
        showThumbnailsOnMobiles
      />
      <div className="mt-8">
        <Pagination
          totalItems={totalPlayers}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          basePath="/admin/players"
        />
      </div>
    </Layout>
  );
};

export default Players;
