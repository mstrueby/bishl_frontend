import Head from 'next/head';
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
          {season.standings.map(({ team, points }, index) => (
            <li key={index}>
              {index+1}. {team} - {points}
            </li>
          ))}
        </ul>
        </section>
    </Layout>
  )
}


export const getStaticPaths = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/`);
  const allSeasonsData = await res.json();
  const paths = allSeasonsData.map((season) => ({
    params: { id: season._id.toString() },
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seasons/${params.id}`);
  const season = await res.json();
  return {
    props: {
      season,
    },
    revalidate: 10,
  };
};