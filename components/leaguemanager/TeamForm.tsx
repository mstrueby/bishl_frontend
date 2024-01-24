import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
//import LogoUpload from '../ui/form/LogoUpload';
import { TeamFormValues } from '../../types/TeamFormValues';

interface TeamFormProps {
  initialValues: TeamFormValues;
  onSubmit: (values: TeamFormValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
}

const ageGroup = [
  { key: 'MEN', value: 'Herren' },
  { key: 'WOMEN', value: 'Damen' },
  { key: 'U19', value: 'Junioren' },
  { key: 'U16', value: 'Jugend' },
  { key: 'U13', value: 'Schüler' },
  { key: 'U10', value: 'Bambini' },
  { key: 'U8', value: 'Mini' }
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

const TeamForm: React.FC<TeamFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel
}) => {
  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          name: Yup.string().required('Der Mannschaftsname ist erforderlich'),
          alias: Yup.string().required('Der Alias ist erforderlich'),
          fullName: Yup.string().required('Der vollständige Name der Mannschaft ist erforderlich'),
          ageGroup: Yup.string().required('Die Altersklasse ist erforderlich'),
          teamNumber: Yup.number().required('Die Mannschaftsnummer ist erforderlich'),
        })}
        onSubmit={onSubmit}
      >
        {({ handleChange }) => (
          <Form>
            <InputText
              name="name"
              autoComplete="off"
              type="text"
              label="Mannschaftsname"
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
              name="fullName"
              autoComplete="off"
              type="text"
              label="Vollständiger Name"
            />
            <InputText
              name="shortName"
              autoComplete="off"
              type="text"
              label="Kurzname"
            />
            <InputText
              name="tinyName"
              autoComplete="off"
              type="text"
              label="Abkürzung"
            />
            <MyListbox name="ageGroup" options={ageGroup} label="Altersklasse" />
            <InputText
              name="teamNumber"
              type="number"
              label="Mannschaftsnummer"
            />
            <Toggle name="active" type="checkbox" label="Aktiv" />
            <Toggle name="external" type="checkbox" label="Extern" />
            <InputText name="ishdId" type="text" label="ISHD-ID" />

            <div className="mt-4 flex justify-end py-4">
              <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
              <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" />
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default TeamForm;