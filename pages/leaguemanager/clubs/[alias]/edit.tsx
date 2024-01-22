// pages/leaguemanager/clubs/[alias]/edit.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import Image from 'next/image';
import axios from 'axios';
import ClubForm from '../../../../components/leaguemanager/ClubForm';
import LayoutAdm from '../../../../components/LayoutAdm';
import { ClubFormValues, Team } from '../../../../types/ClubFormValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { navData } from '../../../../components/leaguemanager/navData';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/clubs/';

interface EditProps {
  jwt: string,
  club: ClubFormValues
}

interface NewTeamModalProps {
  isOpen: boolean,
  onClose: () => void,
  addTeam: (team: Team) => void
}

const NewTeamModal: React.FC<NewTeamModalProps> = ({ isOpen, onClose, addTeam }) => {
  const [team, setTeam] = useState<Team>({
    name: '',
    alias: '',
    fullName: '',
    shortName: '',
    tinyName: '',
    ageGroup: '',
    teamNumber: 0,
    active: false,
    external: false,
    ishdId: '',
    legacyId: 0
  });
  const handleAddTeam = () => {
    const newTeam: Team = { // Add the Team type here
      name: team.name,
      alias: team.alias,
      fullName: team.fullName,
      shortName: team.shortName,
      tinyName: team.tinyName,
      ageGroup: team.ageGroup,
      teamNumber: team.teamNumber,
      active: team.active,
      external: team.external,
      ishdId: team.ishdId,
      legacyId: team.legacyId
    };
    addTeam(newTeam);
    onClose();
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
                    name='name'
                    id='name'
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                    value={team.name}
                    onChange={(e) => setTeam(e.target.value)}
                  />
                </div>
                <div className='mt-4'>
                  <button
                    type='button'
                    className='inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    onClick={handleAddTeam}
                  >
                    Team hinzufügen
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

  // Fetch the existing club data
  let club = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    club = response.data;
  } catch (error) {
    // Handle error (e.g., not found)
    console.error('Could not fetch the club data');
  }

  return club ? { props: { jwt, club } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, club }) => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  // Handler for form submission
  const onSubmit = async (values: ClubFormValues) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key === 'logo' && typeof value === 'string') {
        // If 'logo' field is a string, assume it's the path to the existing logo and it wasn't updated:
        continue;
      }
      formData.append(key, value);
    }
    setError(null);
    try {
      const response = await axios.patch(BASE_URL + club._id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) { // Assuming status 200 means success
        router.push({
          pathname: '/leaguemanager/clubs',
          query: { message: `Der Verein ${values.name} wurde erfolgreich aktualisiert.` }
        }, '/leaguemanager/clubs');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/clubs');
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

  // Form initial values with existing club data
  const initialValues: ClubFormValues = {
    name: club?.name || '',
    addressName: club?.addressName || '',
    street: club?.street || '',
    zipCode: club?.zipCode || '',
    city: club?.city || '',
    country: club?.country || '',
    email: club?.email || '',
    yearOfFoundation: club?.yearOfFoundation || '',
    description: club?.description || '',
    website: club?.website || '',
    ishdId: club?.ishdId || '',
    active: club?.active || false,
    logo: club?.logo || '',
    teams: club?.teams || [],
  };

  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const handleOpenNewTeamModal = () => setIsNewTeamModalOpen(true);
  const handleCloseNewTeamModal = () => setIsNewTeamModalOpen(false);

  const addTeam = (team: Team) => {
    try {
      const response = await axios.post(`${BASE_URL}${club.alias}/teams`, team, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        // Re-fetch the teamas after adding a new one
        const updatedTeams = await getTeams();
        setTeams(updatedTeams);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten bei der Erstellung des Teams.');
    }
  };

  const getTeams = async () => {
    try {
      const response = await axios.get(BASE_URL + club.alias + '/teams', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  };

  // Render the form with initialValues and the edit-specific handlers
  return (
    <LayoutAdm
      navData={navData}
      sectionTitle={`Verein bearbeiten`}
    >

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      {
        club?.logo && (
          <div className="mb-4">
            <Image src={club.logo} alt={club.name} width={200} height={200} objectFit="contain" />
          </div>
        )
      }

      <ClubForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
      />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Mannschaften</h2>
        {teams.map((team, index) => (
          <div key={index} className="mb-4">
            <h3>{team.name}</h3>
          </div>
        )}
      </div>

      <button
        name="addNewSeason"
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={handleOpenNewTeamModal}
      >
        Neues Team hinzufügen
      </button>

      <NewTeamModal isOpen={isNewTeamModalOpen} onClose={handleCloseNewTeamModal} addTeam={addTeam} />

    </LayoutAdm>
  );
};

export default Edit;