import React from 'react'
import { Formik, Form, useFormikContext } from 'formik'
import * as Yup from 'yup'
import InputText from '../ui/form/InputText'
import ButtonPrimary from '../ui/form/ButtonPrimary'
import ButtonLight from '../ui/form/ButtonLight'
import Toggle from '../ui/form/Toggle'
import MyListbox from '../ui/form/Listbox'
import { VenueFormValues } from '../../types/VenueFormValues'

interface VenueFormProps {
  initialValues: VenueFormValues;
  onSubmit: (values: VenueFormValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
}

const countries = [
  { key: 'DE', value: 'Deutschland' },
  { key: 'CH', value: 'Schweiz' },
  { key: 'AT', value: 'Österreich' },
  { key: 'DK', value: 'Dänemark' },
  { key: 'GB', value: 'Großbritannien' }
]

const handleAliasValue = (nameValue: string) => {
  return nameValue.trim().toLowerCase().replace(/\./g, '').replace(/ /g, '-').replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ß/g, 'ss');
}

const AutoAlias = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  React.useEffect(() => {
    const transformedAlias = handleAliasValue(values.name);
    setFieldValue('alias', transformedAlias);
  }, [values.name, setFieldValue]);
  return null;
};

const VenueForm: React.FC<VenueFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
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
        {({ handleChange }) => (
          <Form>
            <InputText
              name="name"
              autoComplete="off"
              type="text"
              label="Name"
              onChange={handleChange}
            />
            <AutoAlias />
            <InputText
              name="alias"
              type="text"
              label="Alias"
              disabled
            />
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