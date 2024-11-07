import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox'
//import LogoUpload from '../ui/form/LogoUpload';
import { SeasonValues } from '../../types/TournamentValues';

interface SeasonFormProps {
  initialValues: SeasonValues;
  onSubmit: (values: SeasonValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
}


const SeasonForm: React.FC<SeasonFormProps> = ({
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
          name: Yup.string().required(
            'Bitte geben Sie einen Namen für die Saison ein.')
        })}
        onSubmit={onSubmit}
      >
        {(formikProps) => (
          <Form>
            <InputText
              name="name"
              autoComplete="off"
              type="text"
              label="Name (Jahr)"
              onChange={formikProps.handleChange}
            />
            <AutoAlias field="name" targetField="alias"/>
            <InputText
              name="alias"
              type="text"
              label="Alias"
              disabled
            />
            
            <Toggle name="published" type="checkbox" label="Veröffentlicht" />

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

export default SeasonForm;