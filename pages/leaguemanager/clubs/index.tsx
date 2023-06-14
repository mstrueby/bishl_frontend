import { GetServerSideProps } from 'next';
import LayoutAdm from '../../../components/LayoutAdm';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';

export default function Clubs({
  allClubsData
}: {
  allClubsData: {
    name: string;
    id: string;
  }[]
}) {
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Vereine',
          newLink: `/leaguemanager/clubs/new`
        }}
        />


      {allClubsData && allClubsData.map(({ id, name }) => {
        return (<div key={id}>{name}</div>)
      }
      )}
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

