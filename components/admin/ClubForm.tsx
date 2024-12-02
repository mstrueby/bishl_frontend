import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
import { ClubValues } from '../../types/ClubValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';

interface ClubFormProps {
  initialValues: ClubValues;
  onSubmit: (values: ClubValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const countries = [
  { key: 'DE', value: 'Deutschland' },
  { key: 'CH', value: 'Schweiz' },
  { key: 'AT', value: 'Österreich' },
  { key: 'DK', value: 'Dänemark' },
  { key: 'GB', value: 'Großbritannien' }
]

const ClubForm: React.FC<ClubFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading,
}) => {
  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          name: Yup.string().required('Der Name des Vereins ist erforderlich'),
          country: Yup.string().required('Das Land ist erforderlich'),
          email: Yup.string().email('Ungültige E-Mail-Adresse'),
          description: Yup.string(),
          website: Yup.string().url('Ungültige URL'),
          //active: Yup.boolean(),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue }) => (
          <Form>
            <InputText name="name" autoComplete="off" type="text" label="Name des Vereins" onChange={handleChange} />
            <AutoAlias field="name" targetField="alias" />
            {values.logoUrl ? (

              <div>
                <div>
                  <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                    Logo
                  </span>
                  <CldImage src={values.logoUrl} alt="Uploaded logo" width={96} height={96}
                    crop="fit"
                    gravity="center"
                    className=" w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFieldValue("logoUrl", null)}
                  className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 sm:ml-0 sm:w-auto"
                >
                  Logo entfernen
                </button>
              </div>
            ) : (
              <ImageUpload name="logo" label="Logo" imageUrl={initialValues.logoUrl || ''} />
            )}
            <InputText name="addressName" type="text" label="Adresse" />
            <InputText name="street" autoComplete="off" type="text" label="Straße" />
            <InputText name="zipCode" autoComplete="off" type="text" label="PLZ" />
            <InputText name="city" autoComplete="off" type="text" label="Stadt" />
            <MyListbox name="country" autoComplete="off" options={countries} label="Land" />
            <InputText name="email" autoComplete="off" type="email" label="E-Mail" />
            <InputText name="yearOfFoundation" type="number" label="Gründungsjahr" />
            <InputText name="description" type="text" label="Beschreibung" />
            <InputText name="website" type="text" label="Webseite" />
            <InputText name="ishdId" type="number" label="ISHD-ID" />
            <Toggle name="active" type="checkbox" label="Aktiv" />
            <div className="mt-4 flex justify-end py-4">
              <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
              <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" isLoading={loading} />
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default ClubForm;