import React from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import InputText from '../ui/form/InputText'
import { AutoAlias } from '../../tools/autoAlias'
import ButtonPrimary from '../ui/form/ButtonPrimary'
import ButtonLight from '../ui/form/ButtonLight'
import Toggle from '../ui/form/Toggle'
import MyListbox from '../ui/form/Listbox'
import RefLevelSelect from './ui/RefLevelSelect'
import { UserValues } from '../../types/UserValues'
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';

interface RefereeFormProps {
  initialValues: UserValues;
  onSubmit: (values: UserValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const RefereeForm: React.FC<RefereeFormProps> = ({
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
        onSubmit={onSubmit}
      >
        <Form>
          <RefLevelSelect
            name="level"
            autoComplete="off"
            type="text"
            label="Level"
          />
          <InputText
            name="passNo"
            autoComplete="off"
            type="text"
            label="Passnummer"
          />
          <InputText
            name="ishdLevel"
            autoComplete="off"
            type="text"
            label="ISHD Level"
          />
          <Toggle
            name="active"
            type="checkbox"
            label="Aktiv"
          />
        </Form>
      </Formik>
    </>
  )
}

export default RefereeForm