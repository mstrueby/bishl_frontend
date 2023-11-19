import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
import { ClubFormValues } from '../../types/ClubFormValues';

interface ClubFormProps {
  initialValues: ClubFormValues;
  onSubmit: (values: ClubFormValues) => void;
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

const ClubForm: React.FC<ClubFormProps> = ({
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
        name: Yup.string().required('Der Name des Vereins ist erforderlich'),
        country: Yup.string().required('Das Land ist erforderlich'),
        email: Yup.string().email('Ungültige E-Mail-Adresse'),
        yearOfFoundation: Yup.number(),
        description: Yup.string(),
        website: Yup.string().url('Ungültige URL'),
        ishdId: Yup.number(),
        //active: Yup.boolean(),
      })}
      onSubmit={onSubmit}
    >
    {({ handleChange }) => (
      <Form>
        <InputText name="name" type="text" label="Name des Vereins" onChange={handleChange} />
        <AutoAlias />
        <InputText
          name="alias"
          type="text"
          label="Alias"
          disabled
        />
        <InputText name="addressName" type="text" label="Adresse" />
        <InputText name="street" type="text" label="Straße" />
        <InputText name="zipCode" type="text" label="PLZ" />
        <InputText name="city" type="text" label="Stadt" />
        <MyListbox name="country" options={countries} label="Land" />
        <InputText name="email" type="email" label="E-Mail" />
        <InputText name="yearOfFoundation" type="number" label="Gründungsjahr" />
        <InputText name="description" type="text" label="Beschreibung" />
        <InputText name="website" type="text" label="Webseite" />
        <InputText name="ishdId" type="number" label="ISHD-ID" />
        <Toggle name="active" type="checkbox" label="Aktiv" />
        <div className="mt-4 flex justify-end py-4">
          <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
          <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" />
        </div>
      </Form>
      )}
    </Formik>
    </>
  );
};

export default ClubForm;