import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import Toggle from '../ui/form/Toggle';
import { UserValues } from '../../types/UserValues';
import RichEditor from '../ui/form/RichEditor';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';

// Define the ProfileFormProps interface
interface ProfileFormProps {
  initialValues: UserValues;
  onSubmit: (values: UserValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
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
        email: Yup.string().required('Das Feld "Titel" ist erforderlich.'),
      })}
      onSubmit={onSubmit}
    >
      {({ values, handleChange, setFieldValue }) => (
        <Form>
          <InputText
            name="firstName"
            label="Vorname"
            type="text"
            disabled
          />
          <InputText
            name="lastName"
            label="Nachname"
            type="text"
            disabled
          />
          <InputText
            name="email"
            label="E-Mail"
            type="email"
          />

          {/**
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
           */}

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

export default ProfileForm;