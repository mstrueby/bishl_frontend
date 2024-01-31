// page to get one round and list all matchdays
// /leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetStaticPropsContext } from 'next';
import { RoundValues } from "../../../../../../types/TournamentValues";
import LayoutAdm from "../../../../../../components/LayoutAdm";
import navData from "../../../../../../components/leaguemanager/navData";
import SuccessMessage from '../../../../../../components/ui/SuccessMessage';
import SectionHeader from '../../../../../../components/leaguemanager/SectionHeader';
import DataList from '../../../../../../components/leaguemanager/DataList';

export default function Round({
  round
}: {
  round: RoundValues;
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { tAlias, sAlias, rAlias } = router.query;

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const dataListItems = round.matchdays
    .slice()
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((matchday) => ({
      name: matchday.name,
      description: matchday.endDate && new Date(matchday.endDate).getTime() > new Date(matchday.startDate).getTime()
        ? `${new Date(matchday.startDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} - ${new Date(matchday.endDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}`
        : new Date(matchday.startDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
      published: matchday.published,
      href: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${matchday.alias}`
    }));
  
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={round.name}
      description="Runde"
      editLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Wettbewerbe", url: `/leaguemanager/tournaments` },
        { order: 2, name: tAlias, url: `/leaguemanager/tournaments/${tAlias}` },
        { order: 3, name: sAlias, url: `/leaguemanager/tournaments/${tAlias}/${sAlias}` }
      ]}
    >
      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
      
      <div className="mt-5">
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          {Object.entries(round).filter(([key]) => key !== 'matchdays').map(([key, value]) => (
            <div key={key} className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">{key}</dt>
              <dd className="mt-1 text-sm text-gray-900">{JSON.stringify(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <SectionHeader
        title="Spieltage"
        newLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/addMatchday/`}
      />

      <DataList
        items={dataListItems}
      />

    </LayoutAdm>
  )
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;

  if (typeof tAlias !== 'string' || typeof sAlias !== 'string' || typeof rAlias !== 'string') {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}`);
    if (!res.ok) {
      console.error('Error fetching round:', res.statusText);
      return {
        notFound: true,
      };
    }
    const roundData = await res.json();

    return {
      props: {
        round: roundData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch round data:', error);
    return {
      notFound: true,
    };
  }
}

export async function getStaticPaths() {
  const tournamentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`);
  const tournaments = await tournamentsRes.json();
  let paths: { params: { tAlias: string; sAlias: string; rAlias: string; } }[] = [];

  for (const tournament of tournaments) {
    const seasonsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/`);
    const seasons = await seasonsRes.json();
    for (const season of seasons) {
      const roundsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`);
      const rounds = await roundsRes.json();
      for (const round of rounds) {
        paths.push({
          params: { tAlias: tournament.alias, sAlias: season.alias, rAlias: round.alias },
        });
      }
    }
  }

  return {
    paths,
    fallback: 'blocking',
  };
}