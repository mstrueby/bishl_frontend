import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { PlayerValues } from '../../types/PlayerValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Toggle from '../ui/form/Toggle';

interface PlayerAdminFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const PlayerAdminForm: React.FC<PlayerAdminFormProps> = ({
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
        validationSchema={Yup.object({
          firstName: Yup.string().required('Der Vorname ist erforderlich'),
          lastName: Yup.string().required('Der Nachname ist erforderlich'),
          birthdate: Yup.string().required('Die Geburtsdatum ist erforderlich'),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue }) => (
          <Form>
            <InputText name="firstName" autoComplete="off" type="text" label="Vorname" />
            <InputText name="lastName" autoComplete="off" type="text" label="Nachname" />
            <InputText name="birthdate" autoComplete="off" type="date" label="Geburtsdatum" />
            <InputText name="nationality" autoComplete="off" type="text" label="Nationalität" />
            <Toggle name="fullFaceReq" label="Vollvisier notwendig" />
            {values.imageUrl ? (
              <div>
                <div>
                  <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                    Bild
                  </span>
                  <CldImage src={values.imageUrl} alt="Uploaded image" width={128} height={128}
                    crop="thumb"
                    gravity="face"
                    className=" w-full object-contain rounded-full"
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
              <ImageUpload name="image" label="Bild" description="Das neue Bild wird erst nach <em>Speichern</em> hochgeladen." imageUrl={initialValues.imageUrl || ''} />
            )}
            <div className="mt-4 flex justify-end py-4">
              <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
              <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" isLoading={loading} />
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default PlayerAdminForm;