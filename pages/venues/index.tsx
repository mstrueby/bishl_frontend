import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';

type Venue = {
  _id: string;
  name: string;
  location: string;
  // ...
};
type VenuesProps = {
  venues: Venue[];
}

export const getServerSideProps: GetServerSideProps<VenuesProps> = async () => {
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/`);
  const venues = await res.json();

  return {
    props: {
      venues,
      revalidate: 60,
    },
  };
};

const Venues = ({venues}: VenuesProps) => {
    return (
      <Layout>
      <h2>Spielstätten</h2>
        <div>
          {venues && venues.map(
            (el: Venue)=>{
              return (<div key={el._id}>{el.name}</div>)
            }
          )}
        </div>
      </Layout>

  )
};

export default Venues;