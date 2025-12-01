
import { GetStaticPropsContext } from 'next';
import Link from 'next/link';
import Head from 'next/head';
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

      {/* Rounds Section */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Runden</h2>
        
        {sortedRounds.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Keine Runden verfügbar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedRounds.map((round) => (
              <Link
                key={round.alias}
                href={`/tournaments/${tAlias}/${sAlias}/${round.alias}`}
                className="relative flex flex-col space-y-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-lg font-medium text-gray-900">
                      {round.name}
                    </p>
                    
                    {/* Round Dates */}
                    {(round.startDate || round.endDate) && (
                      <p className="mt-2 text-sm text-gray-600">
                        {round.startDate && new Date(round.startDate).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                        {round.startDate && round.endDate && ' - '}
                        {round.endDate && new Date(round.endDate).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                    
                    {/* Published Status */}
                    <div className="mt-3 flex items-center">
                      {round.published ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                          Veröffentlicht
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Entwurf
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
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
    // Fetch season data
    const seasonRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}`
    );
    
    if (!seasonRes.ok) {
      console.error('Error fetching season:', seasonRes.statusText);
      return { notFound: true };
    }
    
    const seasonResponse = await seasonRes.json();
    const seasonData = seasonResponse?.data || seasonResponse;

    // Fetch rounds separately
    const roundsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}/rounds`
    );
    
    let rounds: RoundValues[] = [];
    if (roundsRes.ok) {
      const roundsResponse = await roundsRes.json();
      rounds = Array.isArray(roundsResponse)
        ? roundsResponse
        : (roundsResponse?.data || []);
    }

    // Fetch tournament data for breadcrumb
    const tournamentRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}`
    );
    
    if (tournamentRes.ok) {
      const tournamentResponse = await tournamentRes.json();
      const tournamentData = tournamentResponse?.data || tournamentResponse;
      
      return {
        props: {
          season: seasonData,
          rounds,
          tAlias,
          sAlias,
          tournamentName: tournamentData?.name || tAlias,
        },
        revalidate: 300, // 5 minutes
      };
    }

    return {
      props: {
        season: seasonData,
        rounds,
        tAlias,
        sAlias,
        tournamentName: tAlias,
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
    const tournamentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
    const tournamentsData = await tournamentsRes.json();
    
    // Handle standardized API response format
    const tournaments = Array.isArray(tournamentsData) 
      ? tournamentsData 
      : (tournamentsData?.data || []);
    
    let paths: { params: { tAlias: string; sAlias: string } }[] = [];

    for (const tournament of tournaments) {
      const seasonsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons`
      );
      const seasonsData = await seasonsRes.json();
      
      // Handle standardized API response format
      const seasons = Array.isArray(seasonsData) 
        ? seasonsData 
        : (seasonsData?.data || []);
      
      const tournamentPaths = seasons.map((season: SeasonValues) => ({
        params: { tAlias: tournament.alias, sAlias: season.alias },
      }));
      
      paths = paths.concat(tournamentPaths);
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
