import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';

export default function Season({
  season
}: {
  season: {
    tournament: string
    year: number
    standings: []
  }
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
  const paths = allSeasonsData.map((season) => ({
    params: { year: season.year.toString() },
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons?year=${params.year}`);
  var season = await res.json();
  season = season[0];
  return {
    props: {
      season,
    },
    revalidate: 10,
  };
};