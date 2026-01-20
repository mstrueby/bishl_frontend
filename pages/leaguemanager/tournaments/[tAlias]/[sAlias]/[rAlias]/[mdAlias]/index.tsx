// page to get one matchday and list all matches
// /leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]/
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { GetStaticPropsContext } from "next";
import { MatchdayValues } from "../../../../../../../types/TournamentValues";
import LayoutAdm from "../../../../../../../components/LayoutAdm";
import navData from "../../../../../../../components/leaguemanager/navData";
import SuccessMessage from "../../../../../../../components/ui/SuccessMessage";
import Badge from "../../../../../../../components/ui/Badge";
import SectionHeader from "../../../../../../../components/leaguemanager/SectionHeader";
import DescriptionList from "../../../../../../../components/leaguemanager/DescriptionList";

export default function Matchday({ matchday }: { matchday: MatchdayValues }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { tAlias, sAlias, rAlias, mdAlias } = router.query;

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Create an array with matchday values in label name pairs
  const matchdayDetails = [
    { label: "ID", value: matchday._id || "" },
    { label: "Name", value: matchday.name || "" },
    { label: "Typ", value: matchday.type.value || "" },
    { label: "Veröffentlicht", value: matchday.published ? "Ja" : "Nein" },
    {
      label: "Beginn",
      value: matchday.startDate
        ? new Date(matchday.startDate).toLocaleDateString("de-DE")
        : "-",
    },
    {
      label: "Ende",
      value: matchday.endDate
        ? new Date(matchday.endDate).toLocaleDateString("de-DE")
        : "-",
    },
  ];

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={matchday.name}
      description="Spieltag"
      editLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}/edit`}
      breadcrumbs={[
        { order: 1, name: "Wettbewerbe", url: `/leaguemanager/tournaments` },
        {
          order: 2,
          name: tAlias as string,
          url: `/leaguemanager/tournaments/${tAlias}`,
        },
        {
          order: 3,
          name: sAlias as string,
          url: `/leaguemanager/tournaments/${tAlias}/${sAlias}`,
        },
        {
          order: 4,
          name: rAlias as string,
          url: `/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}`,
        },
      ]}
    >
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={handleCloseSuccessMessage}
        />
      )}

      <DescriptionList items={matchdayDetails} />

      <SectionHeader
        title="Spiele"
        newLink={`/leaguemanager/tournaments/${tAlias}/${sAlias}/${rAlias}/${mdAlias}/addMatch/`}
      />

      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  Spiel
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center"
                >
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Link</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              <div>No matches available.</div>
            </tbody>
          </table>
        </div>
      </div>
    </LayoutAdm>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const tAlias = context.params?.tAlias;
  const sAlias = context.params?.sAlias;
  const rAlias = context.params?.rAlias;
  const mdAlias = context.params?.mdAlias;

  if (
    typeof tAlias !== "string" ||
    typeof sAlias !== "string" ||
    typeof rAlias !== "string" ||
    typeof mdAlias !== "string"
  ) {
    return { notFound: true };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tAlias}/seasons/${sAlias}/rounds/${rAlias}/matchdays/${mdAlias}`,
    );
    if (!res.ok) {
      console.error("Error fetching matchday:", res.statusText);
      return {
        notFound: true,
      };
    }
    const matchdayData = await res.json();
    if (!matchdayData || !Array.isArray(matchdayData.matches)) {
      return { notFound: true };
    }

    return {
      props: {
        matchday: matchdayData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Failed to fetch matchday data:", error);
    return {
      notFound: true,
    };
  }
}

export async function getStaticPaths() {
  const tournamentsRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tournaments`,
  );
  const tournaments = await tournamentsRes.json();
  let paths: {
    params: { tAlias: string; sAlias: string; rAlias: string; mdAlias: string };
  }[] = [];

  for (const tournament of tournaments) {
    const seasonsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/`,
    );
    const seasons = await seasonsRes.json();
    for (const season of seasons) {
      const roundsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${tournament.alias}/seasons/${season.alias}/rounds`,
      );
      const rounds = await roundsRes.json();
      for (const round of rounds) {
        const matchdaysRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${
            tournament.alias
          }/seasons/${season.alias}/rounds/${round.alias}/matchdays`,
        );
        const matchdays = await matchdaysRes.json();
        for (const matchday of matchdays) {
          paths.push({
            params: {
              tAlias: tournament.alias,
              sAlias: season.alias,
              rAlias: round.alias,
              mdAlias: matchday.alias,
            },
          });
        }
      }
    }
  }

  return {
    paths,
    fallback: "blocking",
  };
}
