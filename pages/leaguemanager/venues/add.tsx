import { useState } from 'react'
import { useRouter } from 'next/router';
import VenueForm from '../../../components/leaguemanager/VenueForm'
import venueValidator from '../../../components/leaguemanager/venueValidators';
import LayoutAdm from '../../../components/LayoutAdm';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import Layout from '../../components/Layout'
import Backend from '../../components/Backend';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/venues/"


export default function Add() {
  const [error, setError] = useState([])
  const router = useRouter();

  const initialValues = {
    name: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    active: false,
  };

  const onSubmit = async (values: any) => {

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
  };

  const handleCancel = () => {
    router.push('/leaguemanager/venues')
  }

  const validate = (values: any) => {
    const errors = venueValidator(values);
    return errors;
  };

  const formProps = {
    initialValues,
    validate, // or validationSchema. Check example validation schema in validators.js file
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
