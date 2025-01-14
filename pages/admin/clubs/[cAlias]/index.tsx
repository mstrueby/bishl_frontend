import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps, GetStaticPropsContext } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { ClubValues } from "../../../../types/ClubValues";
import LayoutAdm from "../../../../components/LayoutAdm";
import navData from "../../../../components/leaguemanager/navData";
import SuccessMessage from "../../../../components/ui/SuccessMessage";
import SectionHeader from "../../../../components/leaguemanager/SectionHeader";
import DescriptionList from "../../../../components/leaguemanager/DescriptionList";
import DataList from "../../../../components/leaguemanager/DataList";

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/clubs/';

export const getServerSideProps: GetServerSideProps = async(context) => {
  const cAlias = context.params?.cAlias;
  const jwt = getCookie('jwt', context) as string | undefined;

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    const user = userResponse.data;
    if (!user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clubs/${cAlias}`);
    if (!res.ok) {
      console.error('Error fetching club:', res.statusText);
      return {
        notFound: true,
      };
    }
    const clubData = await res.json();
    return {
      props: {
        club: clubData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch club data:', error);
    return {
      notFound: true,
    };
  }
}


export default function Club({
  club
}: {
  club: ClubValues;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { cAlias } = router.query;

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

  const clubDetails = [
    { label: 'ID', value: club._id?.toString() || "" },
    { label: 'Name', value: club.name || "" },
    { label: 'Anschrift', value: club.addressName || "" },
    { label: 'Straße', value: club.street || "" },
    { label: 'PLZ', value: club.zipCode || "" },
    { label: 'Stadt', value: club.city || "" },
    { label: 'Land', value: club.country || "" },
    { label: 'E-Mail', value: club.email || "" },
    { label: 'Gründungsjahr', value: club.yearOfFoundation?.toString() || "" },
    { label: 'Beschreibung', value: club.description || "" },
    { label: 'Website', value: club.website || "" },
    { label: 'ISHD ID', value: club.ishdId?.toString() || "" },
    { label: 'Aktiv', value: club.active === true ? 'Ja' : 'Nein' },
    // Ensure any other potentially undefined values also follow this pattern
  ];

  const dataListItems = club.teams ? club.teams
    .slice()
    .sort((a, b) => b.alias.localeCompare(a.alias))
    .map((team) => ({
      name: team.name,
      description: `${team.fullName} / ${team.ageGroup}`,
      active: team.active,
      href: `/leaguemanager/clubs/${cAlias}/${team.alias}`,
    })) : [];

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={club.name}
      description="Verein"
      editLink={`/leaguemanager/clubs/${cAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Vereine", url: "/leaguemanager/clubs" },
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
      <DescriptionList items={clubDetails} />
      <SectionHeader 
        title={`Mannschaften`} 
        newLink={`/leaguemanager/clubs/${cAlias}/addTeam`}
      />
      <DataList items={dataListItems} />
    </LayoutAdm>
    
  );
}


