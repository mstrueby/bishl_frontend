import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { Switch } from '@headlessui/react';
import { PlayerValues } from '../../types/PlayerValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Badge from '../ui/Badge';
import Toggle from '../ui/form/Toggle';
import AssignmentModal from '../ui/AssignmentModal';
import axios from 'axios';
import { canAlsoPlayInAgeGroup, getAgeGroupRules } from '../../tools/consts';

interface PlayerFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubId: string;
}

const PlayerForm: React.FC<PlayerFormProps> = ({
  initialValues,
  onSubmit,
  enableReinitialize,
  handleCancel,
  loading,
  clubId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [club, setClub] = useState<any>(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/clubs/id/${clubId}`);
        if (response.status === 200) {
          setClub(response.data);
        }
      } catch (error) {
        console.error('Error fetching club:', error);
      }
    };

    if (clubId) {
      fetchClub();
    }
  }, [clubId]);

  return (
    <>
      <div className="mt-8">
        <h3 className="text-base/7 font-semibold text-gray-900 uppercase">Nicht änderbare Felder</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Die Felder <em>Name</em> und <em>Geburtsdatum</em> dienen zur Verknüpfung mit den ISHD-Daten. Weiter unten können Vor- und Nachname für die Anzeige geändert werden.</p>
      </div>
      <div className="mt-6 border-t border-b border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Name, Vorname</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{initialValues.lastName}, {initialValues.firstName}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Geburtsdatum</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{
              new Date(initialValues.birthdate).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            }</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Geschlecht</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.sex} />
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Altersklasse</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.ageGroup ? `${initialValues.ageGroup}${initialValues.overAge ? ' (OA)' : ''}` : '?'} />
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Vollvisier</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.fullFaceReq ? "erforderlich" : "nicht erforderlich"} />
            </dd>
          </div>
          {/* 
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Quelle</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.source} />
            </dd>
          </div>
          **/}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Von ISHD verwaltet</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.managedByISHD ? "Ja" : "Nein"} />
            </dd>
          </div>
        </dl>
      </div>

      <h3 className="text-base/7 font-semibold text-gray-900 mt-12 uppercase">Änderbare Felder</h3>
      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          displayFirstName: Yup.string().required('Der Vorname ist erforderlich'),
          displayLastName: Yup.string().required('Der Nachname ist erforderlich'),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue }) => (
          <Form>
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
            <Toggle name="imageVisible" label="Foto öffentlich anzeigen" />
            <InputText name="displayFirstName" autoComplete="off" type="text" label="Angezeigter Vorname" />
            <InputText name="displayLastName" autoComplete="off" type="text" label="Angezeigter Nachname" />

            {/* Team assignments section */}
            <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-4 mt-12">
              <h3 className="text-base/7 font-semibold text-gray-900 uppercase">Mannschaften</h3>
              {/** DISABLED button
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-md bg-indigo-600 mt-2 sm:mt-0 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Neue Zuordnung
              </button>
              */}
            </div>
            <p className="mt-2 text-sm/6 text-gray-500">Für jede Mannschaft kann der Status <em>aktiv/inaktiv</em> und die <em>Trikotnummer</em> festgelegt werden.</p>

            {/* 
            <AssignmentModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              currentAssignments={values.assignedTeams}
              clubs={club ? [club] : []}
              nextAgeGroupOnly={true}
              ageGroup={initialValues.ageGroup}
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
            **/}

            {values.assignedTeams && values.assignedTeams.length > 0 && (
              <div className="mt-2 divide-y divide-gray-100">
                {values.assignedTeams.map((assignment, index) => {
                  if (assignment.clubId === clubId) {
                    return (
                      <div key={index} className="py-4">
                        <ul className="mt-2 divide-y divide-gray-100">
                          {assignment.teams.map((team, teamIndex) => {
                            const color = initialValues.ageGroup === team.teamAgeGroup ? 'green' :
                              canAlsoPlayInAgeGroup(initialValues.ageGroup, team.teamAgeGroup, initialValues.overAge) ? 'yellow' : 'red';

                            console.log(initialValues.ageGroup, team.teamAgeGroup, initialValues.overAge, canAlsoPlayInAgeGroup(initialValues.ageGroup, team.teeamAgeGroup, initialValues.overAge), color);
                            return (
                              <li key={teamIndex} className="flex items-center justify-between text-sm text-gray-600 py-3">
                                <div className="flex-1 min-w-8 gap-x-4">
                                  <div className="flex items-center gap-x-3">
                                    <div className={`flex-none rounded-full p-1 ${color === 'green' ? 'bg-emerald-500/20' : color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                                      <div className={`size-1.5 rounded-full ${color === 'green' ? 'bg-emerald-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    </div>
                                    <p className="text-sm/6 font-semibold text-gray-900 truncate">
                                      {team.teamName}
                                    </p>
                                  </div>
                                  <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500 space-x-2">

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
                                  </div>
                                </div>

                                <div className="relative gap-x-8 flex items-center">
                                  <input
                                    type="number"
                                    name={`assignedTeams.${index}.teams.${teamIndex}.jerseyNo`}
                                    value={values.assignedTeams[index].teams[teamIndex].jerseyNo || ''}
                                    onChange={handleChange}
                                    min="1"
                                    max="98"
                                    className="block w-16 rounded-md border-0 py-2 pl-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 appearance-none [-webkit-appearance:textfield] [-moz-appearance:textfield]"
                                  />
                                  <Switch
                                    checked={values.assignedTeams[index].teams[teamIndex].active || false}
                                    onChange={(checked) => {
                                      setFieldValue(`assignedTeams.${index}.teams.${teamIndex}.active`, checked);
                                    }}
                                    className={`${values.assignedTeams[index].teams[teamIndex].active ? 'bg-indigo-600' : 'bg-gray-200'
                                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className={`${values.assignedTeams[index].teams[teamIndex].active ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                    />
                                  </Switch>
                                </div></li>
                            );
                          })}
                        </ul>
                      </div>
                    )
                  }
                })}
              </div>
            )}
            {/* Other club assignments section */}
            {values.assignedTeams?.some(assignment => assignment.clubId !== clubId) && (
              <>
                <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-4 mt-12">
                  <h3 className="text-base/7 font-semibold text-gray-900 uppercase">Andere Vereine</h3>
                </div>
                <ul className="mt-2 divide-y divide-gray-100">
                  {values.assignedTeams
                    .filter(assignment => assignment.clubId !== clubId)
                    .map((assignment, index) => (
                      <li key={index}>
                        <div className="py-5">
                          <h4 className="text-sm font-semibold text-gray-900">{assignment.clubName}</h4>
                          <ul className="mt-2 space-y-3">
                            {assignment.teams.map((team, teamIndex) => (
                              <li key={teamIndex} className="flex items-center text-sm text-gray-500">
                                <span className="mr-2">{team.teamName}</span>
                                <span className="mr-2">•</span>
                                <span className="mr-2">{team.passNo}</span>
                                <span className="mr-2">•</span>
                                <span>{new Date(team.modifyDate).toLocaleDateString('de-DE')}</span>
                                {team.jerseyNo && (
                                  <>
                                    <span className="mr-2 ml-2">•</span>
                                    <span>#{team.jerseyNo}</span>
                                  </>
                                )}
                                <span className="ml-2">
                                  <Badge info={team.active ? "aktiv" : "inaktiv"} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                </ul>
              </>
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

export default PlayerForm;