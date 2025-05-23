import React from 'react';
import { useState } from 'react';
import { Formik, Form, Field, useField } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { PlayerValues } from '../../types/PlayerValues';
import { TrashIcon } from '@heroicons/react/24/outline';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Toggle from '../ui/form/Toggle';
import AssignmentModal from '../ui/AssignmentModal';
import { ClubValues } from '../../types/ClubValues';
import { canAlsoPlayInAgeGroup, getAgeGroupRules } from '../../tools/consts';


const SexRadioGroup = () => {
  const [field, meta] = useField('sex');
  return (
    <>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium leading-6 text-gray-900">Geschlecht</label>
        <div className="space-x-4" role="group" aria-labelledby="sex-radio-group">
          <label className="inline-flex items-center">
            <Field
              type="radio"
              name="sex"
              value="männlich"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="ml-2 text-sm text-gray-900">männlich</span>
          </label>
          <label className="inline-flex items-center">
            <Field
              type="radio"
              name="sex"
              value="weiblich"
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span className="ml-2 text-sm text-gray-900">weiblich</span>
          </label>
        </div>
      </div>
      {meta.touched && meta.error && (
        <p className="mt-2 text-sm text-red-600">{meta.error}</p>
      )}
    </>
  );
};


import Badge from '../ui/Badge';

interface PlayerAdminFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubs: ClubValues[];
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
          firstName: Yup.string().required('Vorname ist erforderlich'),
          lastName: Yup.string().required('Nachname ist erforderlich'),
          birthdate: Yup.string().required('Geburtsdatum ist erforderlich'),
          sex: Yup.string().required('Geschlecht ist erforderlich'),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue, errors, touched }) => (
          <Form>
            {/**
            <div className="flex items-center justify-between mt-6 mb-2">
              <span className="block text-sm font-medium leading-6 text-gray-900">Quelle</span>
              <Badge info={values.source} />
            </div>
            */}
            <InputText name="firstName" autoComplete="off" type="text" label="Vorname"
              disabled={values.source === "ISHD"} />
            <InputText name="lastName" autoComplete="off" type="text" label="Nachname"
              disabled={values.source === "ISHD"} />
            <InputText name="birthdate" autoComplete="off" type="date" label="Geburtsdatum"
              disabled={values.source === "ISHD"} />
            <div className="mt-6 mb-2">
              <SexRadioGroup />
            </div>
            <div className="mt-6 mb-2">
              <div className="flex items-center justify-between">
                <span className="block text-sm font-medium leading-6 text-gray-900">Altersklasse</span>
                <Badge info={values.ageGroup ? `${values.ageGroup}${values.overAge ? ' (OA)' : ''}` : '?'} />
              </div>
              {!values.ageGroup && (
                <p className="text-xs text-gray-500 italic">Wird nach dem Speichern festgelegt</p>
              )}
            </div>
            {values.source === 'ISHD' ? (
              <div className="flex items-center justify-between mt-6 mb-2">
                <span className="block text-sm font-medium leading-6 text-gray-900">Vollvisier erforderlich</span>
                <Badge info={values.fullFaceReq ? 'Ja' : 'Nein'} />
              </div>
            ) : (
              <Toggle name="fullFaceReq" label="Vollvisier erforderlich" />
            )}
            <Toggle name="managedByISHD" label="Wird von ISHD verwaltet" />

            {values.imageUrl ? (
              <div className="mt-8">
                <div>
                  {/*
                  <span className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
                    Bild
                  </span>
                  */}
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

            <Toggle name="imageVisible" label="Foto öffentlich anzeigen" />
            {/** 
            <InputText name="nationality" autoComplete="off" type="text" label="Nationalität" />
            */}

            {/* Display assigned clubs and teams */}
            <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-4 mt-8">
              <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
                Zugewiesene Mannschaften
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-md bg-indigo-600 mt-2 sm:mt-0 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Neue Zuordnung
              </button>
            </div>
            <p className="mt-2 text-sm/6 text-gray-500">
              Geänderte Zuordnungen werden erst nach Klick auf <em>Speichern</em> endgültig gespeichert.
            </p>
            <p className="mt-2 text-sm/6 text-gray-500">
              Zuordnungen von der ISHD können hier <em>nicht</em> entfernt werden.
            </p>

            <AssignmentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              clubs={clubs}
              player={values}
              currentAssignments={values.assignedTeams}
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

            {values.assignedTeams && values.assignedTeams.length > 0 &&
              values.assignedTeams.map((assignment, index) => {
                return (
                  <div key={index} className="mt-2 py-4 divide-y divide-gray-100">
                    <h4 className="text-sm font-medium text-gray-900">{assignment.clubName}</h4>
                    <ul className="mt-2 space-y-2">
                      {assignment.teams.map((team, teamIndex) => {
                        const teamAgeGroup = clubs.find(club => club._id === assignment.clubId)
                          ?.teams.find(t => t._id === team.teamId)?.ageGroup;
                        const color = values.ageGroup === teamAgeGroup ? 'green'
                          : canAlsoPlayInAgeGroup(values.ageGroup || '', teamAgeGroup || '', values.overAge || false) ? 'yellow' : 'red';
                        return (
                          <li key={teamIndex} className="flex items-center justify-between text-sm text-gray-600 py-3">
                            <div>
                              <div className="flex-1 min-w-8 gap-x-4">
                                <div className="flex items-center gap-x-3">
                                  <div className={`flex-none rounded-full p-1 ${color === 'green' ? 'bg-emerald-500/20' : color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                                    <div className={`size-1.5 rounded-full ${color === 'green' ? 'bg-emerald-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                  </div>
  
                                  <p className="text-sm/6 font-semibold text-gray-900 truncate">
                                    {team.teamName}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                                <span className="whitespace-nowrap truncate">
                                  {team.passNo}
                                </span>
                                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                  <circle r={1} cx={1} cy={1} />
                                </svg>
                                <span className="whitespace-nowrap truncate">
                                  {new Date(team.modifyDate).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                  <circle r={1} cx={1} cy={1} />
                                </svg>
                                <span className="whitespace-nowrap truncate">
                                  {team.source}
                                </span>
                              </div>
                            </div>
                            <TrashIcon
                              className={`ml-2 h-4 w-4 ${team.source === 'BISHL'
                                ? 'text-red-600 hover:text-red-500 cursor-pointer'
                                : 'text-gray-400 cursor-not-allowed'
                                }`}
                              onClick={() => {
                                if (team.source === 'BISHL') {
                                  const updatedTeams = assignment.teams.filter((_, idx) => idx !== teamIndex);
                                  const updatedAssignments = [...values.assignedTeams];
                                  if (updatedTeams.length === 0) {
                                    // Remove entire club assignment if no teams left
                                    const filteredAssignments = updatedAssignments.filter((_, idx) => idx !== index);
                                    setFieldValue('assignedTeams', filteredAssignments);
                                  } else {
                                    // Update teams for this club
                                    updatedAssignments[index] = {
                                      ...assignment,
                                      teams: updatedTeams
                                    };
                                    setFieldValue('assignedTeams', updatedAssignments);
                                  }
                                }
                              }}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            }

            <div className="mt-4 flex justify-end py-4">
              <ButtonLight name="btnLight" type="button" onClick={handleCancel} label="Abbrechen" />
              <ButtonPrimary name="btnPrimary" type="submit" label="Speichern" isLoading={loading} />
            </div>
          </Form>
        )
        }
      </Formik >
    </>
  );
};

export default PlayerAdminForm;