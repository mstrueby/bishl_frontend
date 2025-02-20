import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { VenueValues } from '../../../types/VenueValues';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DataList from '../../../components/admin/ui/DataList';

let BASE_URL = process.env['API_URL'] + '/venues/';

interface VenuesProps {
  jwt: string,
  venues: VenueValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);

  if (!jwt) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  let venues = null;
  try {
    // First check if user has required role
    const userResponse = await axios.get(`${process.env.API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    const user = userResponse.data;
    if (!user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    venues = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching venues:', error);
    }
  }
  return venues ? { props: { jwt, venues } } : { props: { jwt } };
};

const Venues: NextPage<VenuesProps> = ({ jwt, venues: initialVenues }) => {
  const [venues, setVenues] = useState<VenueValues[]>(initialVenues);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const fetchVenues = async () => {
    try {
      const res = await axios.get(BASE_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setVenues(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching venues:', error);
      }
    }
  };


  const editVenue = (alias: string) => {
    router.push(`/admin/venues/${alias}/edit`);
  };

  const toggleActive = async (venueId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('active', (!currentStatus).toString()); // Toggle the status
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await axios.patch(`${BASE_URL}${venueId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        // Handle successful response
        console.log(`Venue ${venueId} successfully activated`);
        await fetchVenues();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the venue.');
      } else {
        // Handle error response
        console.error('Failed to publish venue.');
      }
    } catch (error) {
      console.error('Error publishing venue:', error);
    }
  }

  const deleteVenue = async (venueId: string) => {
    if (!venueId) return;
    try {
      const response = await axios.delete(`${BASE_URL}${venueId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 204) {
        console.log(`Venue ${venueId} successfully deleted.`);
        await fetchVenues();
      } else {
        console.error('Failed to delete venue');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  };

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

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const venueValues = venues
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((venue: VenueValues) => ({
      ...venue
    }));

  const sectionTitle = 'Spielstätten';
  const newLink = '/admin/venues/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataListItems = venueValues.map((venue: VenueValues) => {
    return {
      _id: venue._id,
      title: venue.name,
      alias: venue.alias,
      description: [venue.street, venue.zipCode + ' ' + venue.city],
      image: venue.imageUrl ? {
        src: venue.imageUrl,
        width: 128,
        height: 72,
        gravity: 'auto',
        className: "rounded-lg object-cover",
        radius: 18,
      } : undefined,
      published: venue.active,
      menu: [
        { edit: { onClick: () => editVenue(venue.alias) } }, 
        { active: { onClick: () => { toggleActive(venue._id, venue.active, venue.imageUrl || null) } } },
        { delete: { onClick: () => { deleteVenue(venue._id) } } }, 
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataListItems}
        statuses={statuses}
        onDeleteConfirm={deleteVenue}
        deleteModalTitle="Spielfläche löschen"
        deleteModalDescription="Möchtest du die Spielfläche <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showThumbnails
        showStatusIndicator
      />

    </Layout>
  );
}

export default Venues;