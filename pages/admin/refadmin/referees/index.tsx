import { useState, useEffect } from "react";
import React from "react";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { UserValues, RefereeValues } from '../../../../types/UserValues';
import Layout from "../../../../components/Layout";
import SectionHeader from "../../../../components/admin/SectionHeader";
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../../tools/dateUtils';
import { refereeLevels } from '../../../../tools/consts'
import DataList from '../../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

interface RefereesProps {
  jwt: string,
  referees: UserValues[],
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let referees: UserValues[] = [];
  try {
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const user = userResponse.data;
    if (!user.roles?.includes('REF_ADMIN') && !user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      }
    };
    const res = await axios.get(`${BASE_URL}/users/referees`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    referees = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching referees:', error);
    }
  }
  return referees ? { props: { jwt, referees } } : { props: { jwt } };
};

const Referees: NextPage<RefereesProps> = ({ jwt, referees: initialReferees }) => {
  const [referees, setReferees] = useState<UserValues[]>(initialReferees);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchReferees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/referees`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      setReferees(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching referees:', error);
      }
    }
  };

  const editReferee = (id: string) => {
    router.push(`/admin/refadmin/referees/${id}/edit`);
  };

  const toggleActive = async (refereeId: string, refereeDoc: RefereeValues | undefined) => {
    try {
      const updatedRefereeDoc = {
        ...refereeDoc,
        active: refereeDoc ? !refereeDoc.active : false, // Toggle the active status
      };
      const formData = new FormData();
      formData.append('referee', JSON.stringify(updatedRefereeDoc));
      console.log(updatedRefereeDoc)
      const response = await axios.patch(`${BASE_URL}/users/${refereeId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });

      if (response.status === 200) {
        console.log(`Referee ${refereeId} active status updated successfully.`);
        await fetchReferees();
      } else if (response.status === 304) {
        console.log('No changes were made to the referee.');
      } else {
        console.error('Failed to update referee active status.');
      }
    } catch (error) {
      console.error('Error updating referee active status:', error);
    }
  }

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const sectionTitle = 'Schiedsrichter';
  const newLink = '/admin/refadmin/referees/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
  }
  const categories = Object.fromEntries(
    Object.entries(refereeLevels).map(([key, value]) => [
      key, 
      `${value.background} ${value.text} ${value.ring} ${value.dot}`
    ])
  );

  const dataListItems = referees.map((referee) => {
    return {
      _id: referee._id,
      title: `${referee.firstName} ${referee.lastName}`,
      alias: referee._id,
      description: [
        referee.referee?.club?.clubName || 'Kein Verein',
        referee.referee?.passNo ? `${referee.referee?.passNo}` : ''
      ].filter(Boolean),
      category: referee.referee?.level !== undefined && referee.referee.level !== "n/a" ? referee.referee.level : undefined,
      image: undefined,
      published: referee.referee?.active,
      featured: false,
      menu: [
        { edit: { onClick: () => editReferee(referee._id) } },
        { active: { onClick: () => { toggleActive(referee._id, referee.referee) } } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        //newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

      <DataList
        items={dataListItems}
        categories={categories}
        statuses={statuses}
        showThumbnails={false}
        showStatusIndicator
      />
    </Layout>
  )
};

export default Referees;