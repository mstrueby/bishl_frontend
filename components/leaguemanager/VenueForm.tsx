import React from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import InputText from '../ui/form/InputText'
import { AutoAlias } from '../../tools/autoAlias'
import ButtonPrimary from '../ui/form/ButtonPrimary'
import ButtonLight from '../ui/form/ButtonLight'
import Toggle from '../ui/form/Toggle'
import MyListbox from '../ui/form/Listbox'
import { VenueValues } from '../../types/VenueValues'
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';

interface VenueFormProps {
  initialValues: VenueValues;
  onSubmit: (values: VenueValues) => void;
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

const VenueForm: React.FC<VenueFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading
}) => {
  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          name: Yup.string()
            .max(30, 'Der Name darf nicht mehr als 30 Zeichen lang sein')
            .required('Name ist ein Pflichtfeld'),
          shortName: Yup.string()
            .max(15, 'Der Kurzname darf nicht mehr als 30 Zeichen lang sein')
            .required('Kurzname ist ein Pflichtfeld'),
          street: Yup.string().required('Straße ist ein Pflichtfeld'),
          zipCode: Yup.string().required('PLZ ist ein Pflichtfeld'),
          city: Yup.string().required('Stadt ist ein Pflichtfeld'),
          country: Yup.string().required('Das Land ist erforderlich'),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue }) => (
          <Form>
            <InputText
              name="name"
              autoComplete="off"
              type="text"
              label="Name"
              onChange={handleChange}
            />
            <AutoAlias field="name" targetField="alias" />
            {values.imageUrl ? (

              <div>
                <div>
                  <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                    Bild
                  </span>
                  <CldImage src={values.imageUrl} alt="Uploaded image" width={600} height={337} aspectRatio="16:9"
                    crop="fill"
                    gravity="auto"
                    className="aspect-[16/9] w-full rounded-xl object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFieldValue("imageUrl", null)}
                  className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 sm:ml-0 sm:w-auto"
                >
                  Bild entfernen
                </button>
              </div>
            ) : (
              <ImageUpload name="image" label="Bild" imageUrl={initialValues.imageUrl || ''} />
            )}
            <InputText
              name="shortName"
              type="text"
              label="Kurzname"
            />
            <InputText
              name="street"
              autoComplete="off"
              type="text"
              label="Straße"
            />
            <InputText
              name="zipCode"
              autoComplete="off"
              type="text"
              label="PLZ"
            />
            <InputText
              name="city"
              autoComplete="off"
              type="text"
              label="Stadt"
            />
            <MyListbox
              name="country"
              options={countries}
              label="Land"
            />
            <InputText
              name="latitude"
              type="number"
              label="Latitude"
            />
            <InputText
              name="longitude"
              type="number"
              label="Longitude"
            />
            <Toggle
              name="active"
              type="checkbox"
              label="Aktiv"
            />
            <div className="mt-4 flex justify-end py-4">
              <ButtonLight
                name="btnLight"
                type="button"
                onClick={handleCancel}
                label="Abbrechen"
              />
              <ButtonPrimary
                name="btnPrimary"
                type="submit"
                label="Speichern"
              />
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default VenueForm