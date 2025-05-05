import { useState, useEffect } from 'react';
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
import { refereeLevels } from '../../tools/consts'
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import ClubSelect from '../ui/ClubSelect';

interface RefereeFormProps {
  initialValues: UserValues;
  onSubmit: (values: UserValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubs?: any[]; // Add clubs prop
}

const RefereeForm: React.FC<RefereeFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading,
  clubs = [], // Provide default empty array
}) => {
  const [selectedLevel, setSelectedLevel] = useState<keyof typeof refereeLevels>(
    initialValues.referee?.level as keyof typeof refereeLevels || 'n/a'
  );
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    initialValues.referee?.club?.clubId || null
  );

  const handleLevelChange = (level: keyof typeof refereeLevels) => {
    setSelectedLevel(level);
    // Update Formik form values
    if (initialValues.referee) {
      initialValues.referee.level = level;
    } else {
      initialValues.referee = {
        level,
        passNo: '',       // default value for passNo
        ishdLevel: '',    // default value for ishdLevel
        active: false     // default value for active
      };
    }
  }



  return (
    <>
      <div className="my-6 border-b border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Name, Vorname</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{initialValues.lastName}, {initialValues.firstName}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">E-Mail</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{initialValues.email}</dd>
          </div>
        </dl>
      </div>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        onSubmit={onSubmit}
      >
        {({ setFieldValue }) => {
          const handleClubChange = (clubId: string) => {
            setSelectedClubId(clubId);
            const selectedClub = clubs.find(club => club._id === clubId);
            if (selectedClub) {
              setFieldValue('referee.club', {
                clubId: selectedClub._id,
                clubName: selectedClub.name,
              });
            }
          };

          return (
            <Form>
              <RefLevelSelect
                selectedLevel={selectedLevel}
                label="Level"
                onLevelChange={handleLevelChange}
              />
              <ClubSelect
                selectedClubId={selectedClubId}
                clubs={clubs}
                onClubChange={handleClubChange}
                label="Verein"
              />
              <InputText
                name="referee.passNo"
                autoComplete="off"
                type="text"
                label="Passnummer"
              />
              <InputText
                name="referee.ishdLevel"
                autoComplete="off"
                type="text"
                label="ISHD Level"
              />
              <Toggle
                name="referee.active"
                type="checkbox"
                label="Aktiv"
              />
              <div className="mt-4 flex justify-end py-4">
                <ButtonLight onClick={handleCancel} name="btnLight" type="button" label="Abbrechen" />
                <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" loading={loading} />
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}

export default RefereeForm