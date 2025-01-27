import React from 'react';
import { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { PlayerValues } from '../../types/PlayerValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Toggle from '../ui/form/Toggle';
import AssignmentModal from '../ui/AssignmentModal';
import { ClubValues } from '../../types/ClubValues';

interface PlayerAdminFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubs: ClubValues[]; // Add proper type from your ClubValues interface
}

const PlayerAdminForm: React.FC<PlayerAdminFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading,
  clubs,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

            {/* Display assigned clubs and teams */}
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold leading-7 text-gray-900">Zugewiesene Mannschaften</h3>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Neue Zuordnung
                </button>

                <AssignmentModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  clubs={clubs}
                  onSave={(newAssignment) => {
                    const currentAssignments = values.assignedTeams || [];
                    const existingClubIndex = currentAssignments.findIndex(
                      (assignment) => assignment.clubId === newAssignment.clubId
                    );

                    if (existingClubIndex === -1) {
                      setFieldValue('assignedTeams', [...currentAssignments, newAssignment]);
                    } else {
                      const updatedAssignments = [...currentAssignments];
                      updatedAssignments[existingClubIndex].teams = [
                        ...updatedAssignments[existingClubIndex].teams,
                        ...newAssignment.teams,
                      ];
                      setFieldValue('assignedTeams', updatedAssignments);
                    }
                    setIsModalOpen(false);
                  }}
                />
              </div>
              
              {values.assignedTeams && values.assignedTeams.length > 0 && (
                <div className="mt-2 divide-y divide-gray-100">
                  {values.assignedTeams.map((assignment, index) => (
                    <div key={index} className="py-4">
                      <h4 className="text-sm font-medium text-gray-900">{assignment.clubName}</h4>
                      <ul className="mt-2 space-y-2">
                        {assignment.teams.map((team, teamIndex) => (
                          <li key={teamIndex} className="text-sm text-gray-600">
                            {team.teamName} {team.passNo && `• ${team.passNo}`} {team.modifyDate && `• ${team.source} • ${new Date(team.modifyDate).toLocaleDateString('de-DE')}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

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