import { NextPage } from 'next';
import LayoutAdm from '../../components/LayoutAdm';
import LmSidebar from '../../components/leaguemanager/LmSidebar';

const LeagueManager: NextPage = () => {
  return (
    <LayoutAdm
      sidebar={<LmSidebar />}
      content={<Content />}
    />
  );
};

export default LeagueManager;

const Content = () => {
  return (
      <h1>League Manager - Dashboard</h1>
  );    
}