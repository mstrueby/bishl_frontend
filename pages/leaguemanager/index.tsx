import { NextPage } from 'next';
import LayoutAdm from '../../components/LayoutAdm';
import LmSidebar from '../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../components/leaguemanager/SectionHeader';

const LeagueManager: NextPage = () => {
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Dashboard',
        }}
      />
    </LayoutAdm>
  );
};

export default LeagueManager;
