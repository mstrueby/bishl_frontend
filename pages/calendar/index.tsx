import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Standings from '../../components/ui/Standings';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'; // Import German locale
import ClipLoader from 'react-spinners/ClipLoader';
import { Match } from '../../types/MatchValues';
import MatchCard from '../../components/ui/MatchCard';
import Matchday from '../leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]';
import { MatchdayValues } from '../../types/TournamentValues';
import TeamFullNameSelect from '../../components/ui/TeamFullNameSelect';
import { Team } from '../../types/MatchValues';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const CURRENT_SEASON = process.env.NEXT_PUBLIC_CURRENT_SEASON;

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: false };
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const res = await fetch(`${BASE_URL}/matches?season=${CURRENT_SEASON}`);
    const matchesData: Match[] = await res.json();
    if (!matchesData || matchesData.length === 0) {
      return { notFound: true };
    }
    return {
      props: {
        matches: matchesData,
      },
      revalidate: 60
    };
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }
};

export default function Calendar({ matches }: { matches: Match[] }) {
  return (
    <Layout>
      <Head>
        <title>Kalender</title>
      </Head>
    </Layout>
  )
};