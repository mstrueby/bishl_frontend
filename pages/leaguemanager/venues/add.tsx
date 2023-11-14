import { useState } from 'react'
import { useRouter } from 'next/router';
import VenueForm from '../../../components/leaguemanager/VenueForm'
import LayoutAdm from '../../../components/LayoutAdm';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { AxiosError } from 'axios';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/venues/"

export const getServerSideProps = ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }) {
  const [error, setError] = useState('' as string);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const initialValues = {
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

  const onSubmit = async (values) => {
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
          query: { message: 'Venue created successfully' }
        }, '/leaguemanager/venues');
      } else {
        setError('An unexpected error occurred');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);
        setError(error?.response?.data.message || 'An error occurred');
      }
      router.push({
        pathname: '/leaguemanager/venues',
        query: { error: 'Failed to create venue' }
      }, '/leaguemanager/venues');
    } finally {
      setLoading(false);
    }

    /*
        const response = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })
        const data = await response.json()
        if (!response.ok) {
          let errArray = data.detail.map(el => {
            return `${el.loc[1]} - ${el.msg}`
          })
          setError(errArray)
        } else {
          setError([])
          router.push('/admin/venues')
          //navigate("/admin/venues", { state: { message: "Spielstätte erfolgreich angelegt." } });
        }
        */
  };

  const handleCancel = () => {
    router.push('/leaguemanager/venues')
  }

  /*const validate = (values: any) => {
    const errors = venueValidator(values);
    return errors;
  };
*/
  const formProps = {
    initialValues,
    //validate, // or validationSchema. Check example validation schema in validators.js file
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
      <VenueForm {...formProps} />
    </LayoutAdm>
  )
}
