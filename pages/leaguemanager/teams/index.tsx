import { GetServerSideProps } from 'next';
import LayoutAdm from '../../../components/LayoutAdm';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';

export default function Teams({
  allTeamsData
}: {
  allTeamsData: {
    name: string;
    id: string;
  }[]
}) {
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Mannschaften',
          newLink: `/leaguemanager/teams/new`
        }}
        />


      {allTeamsData && allTeamsData.map(({ id, name }) => {
        return (<div key={id}>{name}</div>)
      }
      )}
    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/`);
  const allTeamsData = await res.json();

  return {
    props: {
      allTeamsData,
      revalidate: 60,
    },
  };
};

