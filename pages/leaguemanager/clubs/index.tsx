import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { buildUrl } from 'cloudinary-build-url'
import LayoutAdm from '../../../components/LayoutAdm';
import Badge from '../../../components/ui/Badge';
import { ClubValues } from '../../../types/ClubValues';
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { navData } from '../../../components/leaguemanager/navData';
import DataList from '../../../components/leaguemanager/DataList';


const transformedUrl = (id: string) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {
    //effect: {
    //  name: 'grayscale',
    //},
    //effect: {
    //  name: 'tint',
    //  value: '60:blue:white'
    //}
  }
});

export default function Clubs({
  allClubsData
}: {
  allClubsData: ClubValues[];
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

  const dataLisItems = allClubsData
    .slice()
    .sort((a, b) => a.alias.localeCompare(b.alias))
    .map((club: ClubValues) => ({
      name: club.name,
      //description: `${club.alias} / ${club.ageGroup}`,
      active: club.active,
      href: `/leaguemanager/clubs/${club.alias}`,
      imageUrl: club.logo ? transformedUrl(club.logo) : transformedUrl('https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'),
    }));

  
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle='Vereine'
      newLink={`/leaguemanager/clubs/add`}
    >

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataLisItems}
      />
      
    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clubs/`);
  const allClubsData = await res.json();

  return {
    props: {
      allClubsData,
      revalidate: 60,
    },
  };
};

