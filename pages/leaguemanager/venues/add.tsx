import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import VenueForm from '../../../components/leaguemanager/VenueForm'
import LayoutAdm from '../../../components/LayoutAdm';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import { VenueFormValues } from './index'
 
let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/venues/"

interface AddProps {
  jwt: string
}


export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const initialValues: VenueFormValues = {
    name: '',
    alias: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    latitude: '',
    longitude: '',
    active: false,
  };
 
  const onSubmit = async (values: VenueFormValues) => {
    //e.preventDefault();
    setLoading(true);

    try {
      const response = await axios({
        method: 'post',
        url: BASE_URL,
        data: JSON.stringify(values),
        headers: {
          //'Content-Type': 'multipart/form-data',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 201) { // Assuming status 201 means created
        router.push({
          pathname: '/leaguemanager/venues',
          query: { message: `Die neue Spielfläche ${values.name} wurde erfolgreich angelegt.` }
        }, '/leaguemanager/venues');
      } else {
        setError('An unexpected error occurred');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error?.response?.data.detail || 'An error occurred');
      }      
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/leaguemanager/venues')
  }

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

  const formProps = {
    initialValues,
    onSubmit,
    enableReinitialize: false,
    handleCancel,
    isNew: true,
  };
  
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Neue Spielfläche',
        }}
      />
      {error &&
        <div className="border-l-4 border-red-400 rounded-md bg-red-50 p-4 my-4 md:mx-6 lg:mx-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={handleCloseMessage}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      <VenueForm {...formProps} />
      
    </LayoutAdm>
  )
}
