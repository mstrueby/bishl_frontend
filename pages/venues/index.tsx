import { GetServerSideProps, NextPage } from 'next';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { VenueValues } from '../../types/VenueValues';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import DataList from '../../components/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/venues/';

interface VenuePageProps {
  venues: VenueValues[];
}

export const getServerSideProps: GetServerSideProps<VenuePageProps> = async (context) => {
  let venues: VenueValues[] = [];

  try {
    const res = await axios.get(BASE_URL + '?active=true', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    venues = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching venues:', error);
    }
  }

  return { props: { venues: venues } };
};

const Venues: NextPage<VenuePageProps> = ({ venues }) => {
  const venueValues = venues
    .slice()
    .map((venue: VenueValues) => ({
      ...venue
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const dataListItems = venueValues.map((venue: VenueValues) => {
    return {
      _id: venue._id,
      title: venue.name,
      alias: venue.alias,
      //url: `/venues/${venue.alias}`,
      description: [venue.street, venue.zipCode + ' ' + venue.city]
    }
  });

  return (
    <Layout>
      <Head><title>Spielstätten</title></Head>
      <div className="border-b border-gray-200 pb-5 sm:pb-0 mb-8">
        <h1 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Spielstätten</h1>
        <div className="mt-3 sm:mt-4" />
      </div>
      <DataList
        items={dataListItems}
      />
    </Layout>

  )
};

export default Venues;