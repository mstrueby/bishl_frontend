import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import { AutoAlias } from '../../tools/autoAlias';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { Switch } from '@headlessui/react';
import MyListbox from '../ui/form/Listbox';
import { PlayerValues } from '../../types/PlayerValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Badge from '../ui/Badge';

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
  return (
    <>
      <div className="">
        <h3 className="text-base/7 font-semibold text-gray-900 uppercase">Nicht änderbare Felder</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Die Felder <em>Name</em> und <em>Geburtsdatum</em> dienen zur Verknüpfung mit den ISHD-Daten. Weiter unten können Vor- und Nachname für die Anzeige geändert werden.</p>
      </div>
      <div className="mt-6 border-t border-b border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Name</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{initialValues.firstName} {initialValues.lastName}</dd>
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
            <dt className="text-sm/6 font-medium text-gray-900">Vollvisier</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.fullFaceReq ? "erforderlich" : "nicht erforderlich"} />
            </dd>
          </div>
        </dl>
      </div>

      <h3 className="text-base/7 font-semibold text-gray-900 mt-8 uppercase">Änderbare Felder</h3>
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
                  <CldImage src={values.imageUrl} alt="Uploaded image" width={96} height={96}
                    crop="thumb"
                    gravity="face"
                    className=" w-full object-contain"
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
              <ImageUpload name="image" label="Bild" imageUrl={initialValues.imageUrl || ''} />
            )}
            <InputText name="displayFirstName" autoComplete="off" type="text" label="Angezeigter Vorname" />
            <InputText name="displayLastName" autoComplete="off" type="text" label="Angezeigter Nachname" />

            {/* Team assignments section */}
            {values.assignedTeams?.map((assignment, index) => {
              if (assignment.clubId === clubId) {
                return (
                  <div key={index} className="">
                    <h3 className="text-base/7 font-semibold text-gray-900 mt-8 uppercase">Mannschaften</h3>
                    <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Für jede Mannschaft kann der Status <em>aktiv/inaktiv</em> und die <em>Trikotnummer</em> festgelegt werden.</p>
                    <div className="mt-6 border-t border-b border-gray-100">
                      <ul className="divide-y divide-gray-100">
                        {assignment.teams.map((team, teamIndex) => (
                          <li key={teamIndex} className="relative flex justify-between gap-x-6 py-5">
                            <div className="flex-1 min-w-8 gap-x-4">
                              <div className="flex items-center gap-x-3">
                                <p className="text-sm/6 font-semibold text-gray-900 truncate">
                                  {team.teamName}
                                </p>
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
                              </div>
                            </div>

                            <div className="relative gap-x-4 flex items-center">
                              <input
                                type="number"
                                name={`assignedTeams.${index}.teams.${teamIndex}.jerseyNo`}
                                min="1"
                                max="98"
                                className="ml-4 block w-16 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                              />
                              <Switch
                                checked={values.assignedTeams[index].teams[teamIndex].active || false}
                                onChange={(checked) => {
                                  setFieldValue(`assignedTeams.${index}.teams.${teamIndex}.active`, checked);
                                }}
                                className={`${
                                  values.assignedTeams[index].teams[teamIndex].active ? 'bg-indigo-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`${
                                    values.assignedTeams[index].teams[teamIndex].active ? 'translate-x-5' : 'translate-x-0'
                                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                              </Switch>
                            </div>

                            
                          </li>
                          /*
                        <div key={teamIndex} className="mt-4 grid grid-cols-2 gap-4">
                          <p>{team.teamName}</p>
                          <p>{team.passNo} ({team.source})</p>
                          <p>{new Date(team.modifyDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}</p>
                          <Toggle name={`teams.${teamIndex}.active`} type="checkbox" label="Aktiv" />
                          <InputText
                            name={`assignedTeams.${index}.teams.${teamIndex}.jerseyNo`}
                            type="number"
                            label="Trikotnummer"
                            autoComplete="off"
                          />
                        </div>
                        */

                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }
              return null;
            })}

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