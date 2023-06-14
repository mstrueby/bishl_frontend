import { GetServerSideProps } from 'next';
import LayoutAdm from '../../../components/LayoutAdm';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';

export default function Venues({
  allVenuesData
}: {
  allVenuesData: {
    name: string;
    id: string;
  }[]
}) {
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Spielflächen',
          newLink: `/leaguemanager/venues/new`
        }}
        />


      {allVenuesData && allVenuesData.map(({ id, name }) => {
        return (<div key={id}>{name}</div>)
      }
      )}
    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/`);
  const allVenuesData = await res.json();

  return {
    props: {
      allVenuesData,
      revalidate: 60,
    },
  };
};

