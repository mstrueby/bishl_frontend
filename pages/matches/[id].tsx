
import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Match } from '../../types/MatchValues';
import MatchCard from '../../components/ui/MatchCard';

interface MatchDetailProps {
  match: Match;
}

const MatchDetail: NextPage<MatchDetailProps> = ({ match }) => {
  const router = useRouter();
  const { id } = router.query;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title={`Match Details: ${match?.home?.name} vs ${match?.away?.name}`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Match Details</h1>
        {match ? (
          <MatchCard match={match} />
        ) : (
          <div>Match not found</div>
        )}
      </div>
    </Layout>
  );
};

export async function getServerSideProps({ params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${process.env.API_URL}/matches/${params.id}`);
    
    if (!res.ok) {
      return {
        notFound: true,
      };
    }
    
    const match = await res.json();
    
    return {
      props: {
        match,
      },
    };
  } catch (error) {
    console.error('Failed to fetch match details:', error);
    return {
      notFound: true,
    };
  }
}

export default MatchDetail;
