import React from 'react';
import { Formik, Form, useFormikContext, FieldArray } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
import { TournamentFormValues } from '../../types/TournamentFormValues';

interface TournamentFormProps {
  initialValues: TournamentFormValues;
  onSubmit: (values: TournamentFormValues) => void;
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

const TournamentForm: React.FC<TournamentFormProps> = ({
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
          name: Yup.string().required('Der Name des Wettbewerbs ist erforderlich'),
          tinyName: Yup.string().required('Das Kürzel des Wettbewerbs ist erforderlich'),
          ageGroup: Yup.string().required('Die Altersklasse des Wettbewerbs ist erforderlich'),
          //active: Yup.boolean(),
        })}
        onSubmit={onSubmit}
      >
        {(formikProps) => (
          <Form>
            <InputText name="name" autoComplete="off" type="text" label="Name des Wettbewerbs" onChange={formikProps.handleChange} />
            <AutoAlias />
            <InputText
              name="alias"
              type="text"
              label="Alias"
              disabled
            />
            <InputText name="tinyName" type="text" label="Kürzel" />
            <MyListbox name="ageGroup" options={ageGroup} label="Alterklasse" />
            <Toggle name="published" type="checkbox" label="Veröffentlicht" />
            <Toggle name="active" type="checkbox" label="Aktiv" />
            <Toggle name="external" type="checkbox" label="Extern" />

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

export default TournamentForm;