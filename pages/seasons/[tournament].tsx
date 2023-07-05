import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';

interface Season  {
  _id: string;
  tournament: string;
  year: number;
  standings: { team: string, points: number }[];
};

export default function Season({
  season
}: {
  season: Season
}) {
  return (
    <Layout>
      <Head>
        <title>{season.tournament}</title>
      </Head>
      <h1 className="">{season.tournament} - {season.year}</h1>
      <section>
        <ul>
          {season && season.standings?.map(({ team, points }, index) => (
            <li key={index}>
              {index + 1}. {team} - {points}
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/`);
  const allSeasonsData = await res.json();
  const paths = allSeasonsData.map((season: Season) => ({
    params: { tournament: season.tournament },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons?tournament=${params.tournament}`);
  var season = await res.json();
  season = season[0];
  return {
    props: {
      season,
    },
    revalidate: 10,
  };
};