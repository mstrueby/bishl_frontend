import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
//import LogoUpload from '../ui/form/LogoUpload';
import { RoundValues } from '../../types/TournamentValues';
import { AutoAlias } from '../../tools/autoAlias';

interface RoundFormProps {
  initialValues: RoundValues;
  onSubmit: (values: RoundValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
}

const matchdaysType = [
  { key: '1', value: 'Spieltag' },
  { key: '2', value: 'Turnier' },
  { key: '3', value: 'Runde' },
  { key: '4', value: 'Gruppe' }
];

const matchdaysSortedBy = [
  { key: '1', value: 'Name' },
  { key: '2', value: 'Startdatum' },
]

const RoundForm: React.FC<RoundFormProps> = ({
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
            'Bitte geben Sie einen Namen für die Runde ein.'),
          matchdaysType: Yup.string().required(
            'Bitte wählen Sie einen Typ für die Spieltage aus.'),
          matchdaysSortedBy: Yup.string().required(
            'Bitte wählen Sie eine Sortierung für die Spieltage aus.'),
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
            <AutoAlias field="name" targetField="alias"/>
            <InputText
              name="alias"
              type="text"
              label="Alias"
              disabled
            />
            <Toggle name="createStandings" type="checkbox" label="Tabelle erstellen" />
            <Toggle name="createStats" type="checkbox" label="Statistiken erstellen" />
            <MyListbox name="matchdaysType" options={matchdaysType} label="Spieltagtyp" />
            <MyListbox name="matchdaysSortedBy" options={matchdaysSortedBy} label="Sortierung der Spieltage" />
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

export default RoundForm;