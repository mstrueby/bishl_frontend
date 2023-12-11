import { NextPage } from 'next';
import LayoutAdm from '../../components/LayoutAdm';
import { navData } from '../../components/leaguemanager/navData';


const LeagueManager: NextPage = () => {
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Dashboard"
    >
      <div className="">
        <span>Hier kommt die Dashboard-Ansicht</span>
      </div>
    </LayoutAdm>
  );
};

export default LeagueManager;
