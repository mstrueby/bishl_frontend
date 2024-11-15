import React, { useState } from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import { PostValuesForm } from '../../types/PostValues';
import RichEditor from '../ui/form/RichEditor';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary'; // To display the image

// Define the PostFormProps interface
interface PostFormProps {
  initialValues: PostValuesForm;
  onSubmit: (values: PostValuesForm) => void;
  enableReinitialize: boolean;
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

          {values.imageUrl ? (

            <div>
              <div>
                <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                  Beitragsbild
                </span>
                <CldImage src={values.imageUrl} alt="Uploaded image" width={600} height={337} aspectRatio="16:9"
                  crop="fill"
                  gravity="auto"
                  className="aspect-[16/9] w-full rounded-xl object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                />
              </div>
              <button
                type="button"
                onClick={() => setFieldValue("imageUrl", null)}
                className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 sm:ml-0 sm:w-auto"
              >
                Bild entfernen
              </button>
            </div>
          ) : (
            <ImageUpload name="image" label="Beitragsbild" imageUrl={initialValues.imageUrl || ''} />
          )}

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
          <div className="border-b border-gray-900/10 pb-10 mb-12">
            <h2 className="text-base/7 font-semibold text-gray-900 mt-6">Author</h2>
            <p className="mt-1 text-sm/6 text-gray-500">Gib einen abweichenden Author ein</p>
            <InputText
              name="author.firstName"
              label="Vorname"
              onChange={handleChange}
              value={values.author.firstName}
            />
            <InputText
              name="author.lastName"
              label="Nachname"
              onChange={handleChange}
              value={values.author.lastName}
            />
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