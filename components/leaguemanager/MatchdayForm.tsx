import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import InputText from  '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
//import LogoUpload from '../ui/form/LogoUpload';
import { MatchdayValues } from '../../types/TournamentValues';
import { AutoAlias } from '../../tools/utils';

interface MatchdayFormProps {
  initialValues: MatchdayValues;
  onSubmit: (values: MatchdayValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
}

const type = [
  { key: '1', value: 'Round Robin' },
  { key: '2', value: 'Playoffs' },
];

const MatchdayForm: React.FC<MatchdayFormProps> = ({
  initialValues,
  onSubmit,
  handleCancel,
  enableReinitialize
}) => {
  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          name: Yup.string().required(
            'Bitte geben Sie einen Namen für den Spieltag ein.'
          ),
          type: Yup.string().required(
            'Bitte wählen Sie einen Typ für den Spieltag aus.'
          ),
        })}
        onSubmit={onSubmit}
      >
        {(formikProps) => (
          <Form>
            <InputText
              name="name"
              autoComplete="off"
              type="text"
              label="Name"
              onChange={formikProps.handleChange}
            />
            <AutoAlias />
            <InputText
              name="alias"
              type="text"
              label="Alias"
              disabled
            />
            <Toggle name="createStandings" type="checkbox" label="Tabelle erstellen" />
            <Toggle name="createStats" type="checkbox" label="Statistiken erstellen" />
            <MyListbox name="type" options={type} label="Spieltagtyp" />
            <Toggle name="published" type="checkbox" label="Veröffentlicht" />
            <div className= "mt-4 flex justify-end py-4">
              <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
              <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" />
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default MatchdayForm;