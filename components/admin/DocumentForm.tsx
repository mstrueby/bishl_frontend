import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import MyListBox from '../ui/form/Listbox';
import Toggle from '../ui/form/Toggle';
import { DocumentValuesForm } from '../../types/DocumentValues';
import ImageUpload from '../ui/form/ImageUpload';

interface DocumentFormProps {
  initialValues: DocumentValuesForm;
  onSubmit: (values: DocumentValuesForm) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const categories = [
  { key: 'ALLGEMEIN', value: 'Allgemein' },
  { key: 'SPIELBETRIEB', value: 'Spielbetrieb' },
  { key: 'HOBBYLIGA', value: 'Hobbyliga' },
]

const DocumentForm: React.FC<DocumentFormProps> = ({
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
        title: Yup.string().required('Bitte geben Sie einen Titel ein.'),
        // TODO: file is mandantory!
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

          {values.url && (
            <div>
              <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                Aktuelle Datei
              </span>
              <span className="mt-2 text-xs sm:text-sm text-gray-500">{values.fileName}</span>
            </div>
          )}
          <ImageUpload name="file" label="Datei" description="Die neue Datei wird erst nach <em>Speichern</em> hochgeladen." imageUrl={initialValues.url || ''} />
          <MyListBox
            name="category"
            label="Kategorie"
            options={categories}
          />
          <Toggle
            name="published"
            type="checkbox"
            label="Veröffentlicht"
            description="Das Dokument wird auf der Webseite angezeigt."
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

export default DocumentForm;