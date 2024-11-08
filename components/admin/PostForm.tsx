import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import { PostValuesAdd } from '../../types/PostValues';
import RichEditor from '../ui/form/RichEditor';
import ImageUpload from '../ui/form/ImageUpload';

// Define Props
interface PostFormProps {
  initialValues: PostValuesAdd;
  onSubmit: (values: PostValuesAdd) => void;
  enableReinitialize?: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading,
}) => {

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={enableReinitialize}
      validationSchema={Yup.object({
        title: Yup.string()
          .required('Das Feld "Titel" ist erforderlich.')
          .max(100, 'Das Feld "Titel" darf maximal 100 Zeichen enthalten.'),
        content: Yup.string().required('Das Feld "Inhalt" ist erforderlich.'),
        published: Yup.boolean(),
        featured: Yup.boolean(),
      })}
      onSubmit={onSubmit}
    >
      {({ values, handleChange, setFieldValue }) => (
        <Form>
          <InputText
            name="title"
            label="Titel"
            onChange={handleChange}
          />
          <AutoAlias field="title" targetField="alias" />
          <ImageUpload name="image" label="Beitragsbild" imageUrl={initialValues.imageUrl} />
          <label
            htmlFor="content"
            className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
            Inhalt
          </label>
          <div>
            <Field name="content" as={RichEditor}>
              {({ field }: FieldProps) => (
                <RichEditor
                  name={field.name}
                />
              )}
            </Field>
          </div>
          <Toggle
            name="published"
            type="checkbox"
            label="Veröffentlicht"
            description="Der Beitrag ist generell auf der Website auffindbar."
          />
          <Toggle
            name="featured"
            type="checkbox"
            label="Angeheftet"
            description="Der Beitrag wird als oberster Beitrag auf der Startseite angezeigt."
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
              isLoading={loading}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PostForm;