import { GetServerSideProps, NextPage } from 'next';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { ClubValues } from '../../types/ClubValues';
import axios from 'axios';
import DataList from '../../components/ui/DataList';

let BASE_URL = process.env['API_URL'] + '/clubs/';

interface ClubPageProps {
  clubs: ClubValues[];
}

export const getServerSideProps: GetServerSideProps<ClubPageProps> = async (context) => {
  let clubs: ClubValues[] = [];

  try {
    const res = await axios.get(BASE_URL + '?active=true', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    clubs = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching clubs:', error);
    }
  }

  return { props: { clubs: clubs } };
};

const Clubs: NextPage<ClubPageProps> = ({ clubs }) => {
  const clubValues = clubs
    .slice()
    .map((club: ClubValues) => ({
      ...club
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const dataListItems = clubValues.map((club: ClubValues) => {
    return {
      _id: club._id,
      title: club.name,
      alias: club.alias,
      //url: `/clubs/${club.alias}`,
      //description: [club.street, club.zipCode + ' ' + club.city]
      image: {
        src: club.logoUrl ? club.logoUrl : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png',
        width: 32,
        height: 32,
        gravity: 'center',
        className: 'object-contain',
        radius: 0,
      }
    }
  });

  return (
    <Layout>
      <Head><title>Vereine</title></Head>
      <div className="border-b border-gray-200 pb-5 sm:pb-0 mb-8">
        <h1 className="my-4 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Vereine</h1>
        <div className="mt-3 sm:mt-4" />
      </div>
      <DataList
        items={dataListItems}
      />
    </Layout>

  )
};

export default Clubs;