
import { GetStaticPropsContext } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../../../../components/Layout';
import { RoundValues } from '../../../../../types/TournamentValues';
import Standings from '../../../../../components/ui/Standings';
import apiClient from '../../../../../lib/apiClient';

interface StandingsPageProps {
  round: RoundValues;
  tAlias: string;
  sAlias: string;
  rAlias: string;
  tournamentName: string;
  seasonName: string;
}

export default function StandingsPage({
  round,
  tAlias,
  sAlias,
  rAlias,
  tournamentName,
  seasonName,
}: StandingsPageProps) {
  return (
    <Layout>
      <Head>
        <title>Tabelle - {round.name} - {seasonName} - {tournamentName} | BISHL</title>
        <meta
          name="description"
          content={`Tabelle der ${round.name} der Saison ${seasonName} im ${tournamentName}.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}/${rAlias}/standings`}
        />
      </Head>

      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tournaments" className="hover:text-gray-700">
              Wettbewerbe
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}`} className="hover:text-gray-700">
              {tournamentName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}/${sAlias}`} className="hover:text-gray-700">
              {seasonName}
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/tournaments/${tAlias}/${sAlias}/${rAlias}`} className="hover:text-gray-700">
              {round.name}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-900" aria-current="page">
            Tabelle
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Tabelle
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {round.name} · {seasonName} · {tournamentName}
        </p>
      </div>

      {/* Standings */}
      <section className="mt-10">
        {round.createStandings && round.standings ? (
          <Standings 
            standingsData={round.standings} 
            matchSettings={round.matchSettings}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Keine Tabelle verfügbar</p>
          </div>
        )}
      </section>

      {/* Back Link */}
      <div className="mt-8">
        <Link
          href={`/tournaments/${tAlias}/${sAlias}/${rAlias}`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Zurück zur Runde
        </Link>
      </div>
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string' || typeof rAlias !== 'string') {
    return { notFound: true };
  }

  try {
    const roundResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`);
    const roundData = roundResponse.data;

    let seasonName = sAlias;
    try {
      const seasonResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`);
      seasonName = seasonResponse.data?.name || sAlias;
    } catch (error) {
      console.error('Error fetching season:', error);
    }

    let tournamentName = tAlias;
    try {
      const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
      tournamentName = tournamentResponse.data?.name || tAlias;
    } catch (error) {
      console.error('Error fetching tournament:', error);
    }

    return {
      props: {
        round: roundData,
        tAlias,
        sAlias,
        rAlias,
        tournamentName,
        seasonName
      },
      revalidate: 180,
    };
  } catch (error) {
    console.error('Failed to fetch round data:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const tournamentsResponse = await apiClient.get('/tournaments');
    const tournaments = tournamentsResponse.data || [];
    
    let paths: { params: { tAlias: string; sAlias: string; rAlias: string } }[] = [];

    for (const tournament of tournaments) {
      try {
        const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
        const seasons = seasonsResponse.data || [];

        for (const season of seasons) {
          try {
            const roundsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`);
            const rounds = roundsResponse.data || [];

            const seasonPaths = rounds.map((round: RoundValues) => ({
              params: { 
                tAlias: tournament.alias, 
                sAlias: season.alias,
                rAlias: round.alias 
              },
            }));
            
            paths = paths.concat(seasonPaths);
          } catch (error) {
            console.error(`Error fetching rounds for ${tournament.alias}/${season.alias}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching seasons for ${tournament.alias}:`, error);
      }
    }

    return {
      paths,
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Failed to generate static paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}
