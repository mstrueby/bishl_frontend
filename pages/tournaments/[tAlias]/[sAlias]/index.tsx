
import { GetStaticPropsContext } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckIcon } from '@heroicons/react/20/solid';
import Layout from '../../../../components/Layout';
import { SeasonValues, RoundValues } from '../../../../types/TournamentValues';
import apiClient from '../../../../lib/apiClient';

interface SeasonOverviewPropsUpdated {
  season: SeasonValues;
  rounds: RoundValues[];
  tAlias: string;
  sAlias: string;
  tournamentName: string;
}

export default function SeasonOverview({
  season,
  rounds,
  tAlias,
  sAlias,
  tournamentName
}: SeasonOverviewPropsUpdated) {
  const router = useRouter();
  
  // Sort rounds by alias (most recent first)
  const sortedRounds = rounds
    .slice()
    .sort((a, b) => b.alias.localeCompare(a.alias));

  return (
    <Layout>
      <Head>
        <title>{season.name} - {tournamentName} | BISHL</title>
        <meta
          name="description"
          content={`Übersicht über die Saison ${season.name} im ${tournamentName}. Alle Runden und Spieltage.`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}/tournaments/${tAlias}/${sAlias}`}
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
          <li className="font-medium text-gray-900" aria-current="page">
            {season.name}
          </li>
        </ol>
      </nav>

      {/* Season Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {season.name}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {tournamentName}
        </p>
        {season.published && (
          <span className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Veröffentlicht
          </span>
        )}
      </div>

      {/* Tournament/Season Selector and Archive Link */}
      <section className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label htmlFor="season-select" className="text-sm font-medium text-gray-700">
            Saison:
          </label>
          <select
            id="season-select"
            value={sAlias}
            onChange={(e) => router.push(`/tournaments/${tAlias}/${e.target.value}`)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {/* This will be populated with all seasons - needs server data */}
            <option value={sAlias}>{season.name}</option>
          </select>
        </div>
        <Link
          href={`/tournaments/${tAlias}/archive`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Ältere Saisons →
        </Link>
      </section>

      {/* Round Navigation (Pills) */}
      {sortedRounds.length > 0 && (
        <section className="mt-8">
          <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Runden">
            {sortedRounds.map((round) => (
              <Link
                key={round.alias}
                href={`/tournaments/${tAlias}/${sAlias}/${round.alias}`}
                className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-all whitespace-nowrap"
              >
                {round.name}
              </Link>
            ))}
          </nav>
        </section>
      )}

      {/* Default View: Show current/latest round details */}
      {sortedRounds.length > 0 && (
        <section className="mt-8">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              Wählen Sie eine Runde aus, um Spiele und Tabellen anzuzeigen
            </p>
            <Link
              href={`/tournaments/${tAlias}/${sAlias}/${sortedRounds[0].alias}`}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Aktuelle Runde: {sortedRounds[0].name}
            </Link>
          </div>
        </section>
      )}

      {sortedRounds.length === 0 && (
        <section className="mt-8">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Keine Runden verfügbar</p>
          </div>
        </section>
      )}
    </Layout>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string') {
    return { notFound: true };
  }

  try {
    // Fetch season data using apiClient
    const seasonResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}`);
    const seasonData = seasonResponse.data;

    // Fetch rounds separately using apiClient
    let rounds: RoundValues[] = [];
    try {
      const roundsResponse = await apiClient.get(`/tournaments/${tAlias}/seasons/${sAlias}/rounds`);
      rounds = roundsResponse.data || [];
    } catch (error) {
      console.error('Error fetching rounds:', error);
      // Continue with empty rounds array
    }

    // Fetch tournament data for breadcrumb using apiClient
    let tournamentName = tAlias;
    try {
      const tournamentResponse = await apiClient.get(`/tournaments/${tAlias}`);
      tournamentName = tournamentResponse.data?.name || tAlias;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      // Continue with tAlias as tournament name
    }

    return {
      props: {
        season: seasonData,
        rounds,
        tAlias,
        sAlias,
        tournamentName,
      },
      revalidate: 300, // 5 minutes
    };
  } catch (error) {
    console.error('Failed to fetch season data:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const tournamentsResponse = await apiClient.get('/tournaments');
    const tournaments = tournamentsResponse.data || [];
    
    let paths: { params: { tAlias: string; sAlias: string } }[] = [];

    for (const tournament of tournaments) {
      try {
        const seasonsResponse = await apiClient.get(`/tournaments/${tournament.alias}/seasons`);
        const seasons = seasonsResponse.data || [];
        
        const tournamentPaths = seasons.map((season: SeasonValues) => ({
          params: { tAlias: tournament.alias, sAlias: season.alias },
        }));
        
        paths = paths.concat(tournamentPaths);
      } catch (error) {
        console.error(`Error fetching seasons for ${tournament.alias}:`, error);
        // Continue with other tournaments
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
