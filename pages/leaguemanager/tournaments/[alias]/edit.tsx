// pages/leaguemanager/Tournaments/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import TournamentForm from '../../../../components/leaguemanager/TournamentForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import { TournamentFormValues, Season } from '../../../../types/TournamentFormValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/tournaments/';

interface EditProps {
  jwt: string,
  tournament: TournamentFormValues
}

interface NewSeasonModalProps {
  isOpen: boolean,
  onClose: () => void,
  addSeason: (season: Season) => void
}

const NewSeasonModal: React.FC<NewSeasonModalProps> = ({ isOpen, onClose, addSeason }) => {
  // Step 1: Add state for new season year
  const [seasonYear, setSeasonYear] = useState('');
  // Step 3: Handle the submission of the new season
  const handleAddSeason = () => {
    const newSeason = { year: seasonYear, published: false, rounds: [] };
    addSeason(newSeason);
    setSeasonYear(''); // Reset the input box after adding the season
    onClose(); // Close the modal
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={onClose}>
        <Transition.Child as={Fragment} enter='ease-out duration-300' enterFrom='opacity-0' enterTo='opacity-100' leave='ease-in duration-200' leaveFrom='opacity-100' leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>
        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child as={Fragment} enter='ease-out duration-300' enterFrom='opacity-0 scale-95' enterTo='opacity-100 scale-100' leave='ease-in duration-200' leaveFrom='opacity-100 scale-100' leaveTo='opacity-0 scale-95'>
              <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>Neue Saison</Dialog.Title>
                <div className='mt-4'>
                  <label htmlFor='seasonYear' className='block text-sm font-medium text-gray-700'>Jahr der Saison</label>
                  <input
                    type='text'
                    name='seasonYear'
                    id='seasonYear'
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                    value={seasonYear}
                    onChange={(e) => setSeasonYear(e.target.value)}
                  />
                </div>
                <div className='mt-4'>
                  <button
                    type='button'
                    className='inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    onClick={handleAddSeason}
                  >
                    Saison hinzufügen
                  </button>
                  <button onClick={onClose} className='ml-2'>Schließen</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the existing Tournament data
  let tournament = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    tournament = response.data;
  } catch (error) {
    // Handle error (e.g., not found)
    console.error('Could not fetch the tournament data');
  }

  return tournament ? { props: { jwt, tournament } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, tournament }) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [seasons, setSeasons] = useState(tournament?.seasons || []);

  // Handler for form submission
  const onSubmit = async (values: TournamentFormValues) => {
    setError(null);

    // Ignore seasons for update
    const { seasons, ...valuesToSend } = values;

    console.log(valuesToSend);
    try {
      const response = await axios.patch(BASE_URL + tournament._id, valuesToSend, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/tournaments',
          query: { message: `Der Wettbewerb ${valuesToSend.name} wurde erfolgreich aktualisiert.` }
        }, '/leaguemanager/tournaments');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/tournaments');
  };

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  // Handler to close the success message
  const handleCloseMessage = () => {
    setError(null);
  };

  // Form initial values with existing tournament data
  const initialValues: TournamentFormValues = {
    name: tournament?.name || '',
    alias: tournament?.alias || '',
    tinyName: tournament?.tinyName || '',
    ageGroup: tournament?.ageGroup || '',
    published: tournament?.published || false,
    active: tournament?.active || false,
    external: tournament?.external || false,
    //website: tournament?.website || '',
    seasons: tournament?.seasons.map(season => ({
      year: season.year,
      published: season.published,
      rounds: []
    })) || []
  };

  const [isNewSeasonModalOpen, setIsNewSeasonModalOpen] = useState(false);
  const handleOpenNewSeasonModal = () => setIsNewSeasonModalOpen(true);
  const handleCloseNewSeasonModal = () => setIsNewSeasonModalOpen(false);

  const addSeason = async (season: Season) => {
    try {
      const response = await axios.post(`${BASE_URL}${tournament._id}/seasons`, season, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        // Re-fetch the seasons after adding a new one
        const updatedSeasons = await fetchSeasons();
        setSeasons(updatedSeasons);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten bei der Erstellung der Saison.');
    }
  };

  // Function to fetch seasons list again
  const fetchSeasons = async () => {
    try {
      const response = await axios.get(`${BASE_URL}${tournament._id}/seasons`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      return response.data; // Assuming the response body will be the list of seasons
    } catch (error) {
      setError('Seasons could not be fetched.');
      return []; // Return empty array in case of error
    }
  };

  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={`Wettbewerb bearbeiten`}
    >

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <TournamentForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
      />

      <div><h2>Saisons</h2></div>
      {seasons.map((season, index) => (
        <div key={index}>
          <h3>{season.year}</h3>
        </div>
      ))}

      <button
        name="addNewSeason"
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={handleOpenNewSeasonModal}
      >
        Neue Saison hinzufügen
      </button>
      <NewSeasonModal isOpen={isNewSeasonModalOpen} onClose={handleCloseNewSeasonModal} addSeason={addSeason} />

    </LayoutAdm >
  )
};

export default Edit;