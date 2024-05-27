// page to list all tournaments
// /leaguemanager/tournaments
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from 'next';
import { TournamentValues } from "../../../types/TournamentValues";
import LayoutAdm from "../../../components/LayoutAdm";
import navData from "../../../components/leaguemanager/navData";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from "../../../components/leaguemanager/DataList";

export default function Tournament({
  allTournamentData,
}: {
  allTournamentData: TournamentValues[];
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };



  const dataLisItems = allTournamentData
    .slice()
    .sort((a, b) => a.alias.localeCompare(b.alias))
    .map((tournament: TournamentValues) => ({
      name: tournament.name,
      description: `${tournament.tinyName} / ${tournament.ageGroup}`,
      published: tournament.published,
      href: `/leaguemanager/tournaments/${tournament.alias}`,
  }));

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Wettbewerbe"
      newLink="/leaguemanager/tournaments/add"
    >

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
      />
      
    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/`);
  const allTournamentData = await res.json();
  return {
    props: {
      allTournamentData,
      revalidate: 60,
    },
  };
};