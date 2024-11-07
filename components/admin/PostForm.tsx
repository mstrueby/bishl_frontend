import React from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import InputText from '../ui/form/InputText'
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary'
import ButtonLight from '../ui/form/ButtonLight'
import Toggle from '../ui/form/Toggle'
import { PostValuesAdd } from '../../types/PostValues'

interface PostFormProps {
  initialValues: PostValuesAdd;
  onSubmit: (values: PostValuesAdd) => void;
  enableReinitialize?: boolean;
  handleCancel: () => void;
}

const PostForm: React.FC<PostFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
}) => {
  return (
    <>
      <Formik
        initialValues={initialValues}
        enableReiniialize={enableReinitialize}
        validationSchema={Yup.object({
          title: Yup.string().required('Das Feld "Titel" ist erforderlich.'),
          alias: Yup.string().required('Das Feld "Alias" ist erforderlich.'),
          content: Yup.string().required('Das Feld "Inhalt" ist erforderlich.'),
          published: Yup.boolean(),
          featured: Yup.boolean(),
        })}
        onSubmit={onSubmit}
      >
        {({ handleChange }) => (
          <Form>
            <InputText
              name="title"
              label="Titel"
              onChange={handleChange}
            />
            <AutoAlias field="title" targetField="alias" />
            <InputText
              name="content"
              label="Inhalt"
              onChange={handleChange}
            />
            <Toggle
              name="published"
              type="checkbox"
              label="Veröffentlicht"
            />
            <Toggle
              name="featured"
              type="checkbox"
              label="Angeheftet"
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

export default PostForm