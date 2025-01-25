import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../ui/form/InputText';
import ButtonPrimary from '../ui/form/ButtonPrimary';
import ButtonLight from '../ui/form/ButtonLight';
import { PlayerValues } from '../../types/PlayerValues';
import { ClubValues } from '../../types/ClubValues';
import ImageUpload from '../ui/form/ImageUpload';
import { CldImage } from 'next-cloudinary';
import Toggle from '../ui/form/Toggle';
import MyListbox from '../ui/form/Listbox';
import axios from 'axios';

interface PlayerAdminFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  jwt?: string;
}

const AddTeamSection = ({ values, setFieldValue, jwt }: { values: PlayerValues, setFieldValue: any, jwt: string }) => {  
  const [clubs, setClubs] = useState<ClubValues[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/clubs/`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        setClubs(response.data.filter(club => club.active));
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };
    fetchClubs();
  }, [jwt]);

  useEffect(() => {
    if (selectedClub) {
      const club = clubs.find(c => c._id === selectedClub);
      setAvailableTeams(club?.teams || []);
    }
  }, [selectedClub, clubs]);

  const handleAddTeam = () => {
    if (!selectedClub || !selectedTeam) return;

    const club = clubs.find(c => c._id === selectedClub);
    const team = club?.teams.find(t => t._id === selectedTeam);

    if (!club || !team) return;

    const existingClubIndex = values.assignedTeams.findIndex(
      assignment => assignment.clubId === selectedClub
    );

    if (existingClubIndex >= 0) {
      // Add team to existing club assignment
      const teamExists = values.assignedTeams[existingClubIndex].teams.some(
        t => t.teamId === selectedTeam
      );

      if (!teamExists) {
        const newTeams = [
          ...values.assignedTeams[existingClubIndex].teams,
          {
            teamId: team._id,
            teamName: team.name,
            teamAlias: team.alias,
            teamIshdId: team.ishdId,
            passNo: '',
            source: 'MANUAL',
            modifyDate: new Date().toISOString(),
            jerseyNo: 0,
            active: true
          }
        ];
        setFieldValue(`assignedTeams.${existingClubIndex}.teams`, newTeams);
      }
    } else {
      // Add new club assignment with team
      const newAssignment = {
        clubId: club._id,
        clubName: club.name,
        clubAlias: club.alias,
        clubIshdId: club.ishdId,
        teams: [{
          teamId: team._id,
          teamName: team.name,
          teamAlias: team.alias,
          teamIshdId: team.ishdId,
          passNo: '',
          source: 'MANUAL',
          modifyDate: new Date().toISOString(),
          jerseyNo: 0,
          active: true
        }]
      };
      setFieldValue('assignedTeams', [...values.assignedTeams, newAssignment]);
    }

    setSelectedTeam('');
  };

  return (
    <div className="space-y-4">
      <MyListbox
        name="club"
        label="Verein"
        options={clubs.map(club => ({ key: club._id, value: club.name }))}
        onChange={(value) => setSelectedClub(value)}
      />

      {selectedClub && (
        <MyListbox
          name="team"
          label="Mannschaft"
          options={availableTeams.map(team => ({ key: team._id, value: team.name }))}
          onChange={(value) => setSelectedTeam(value)}
        />
      )}

      <button
        type="button"
        onClick={handleAddTeam}
        disabled={!selectedClub || !selectedTeam}
        className="mt-2 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-300"
      >
        Team hinzufügen
      </button>
    </div>
  );
};

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
            
            {/* Team Management Section */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-gray-900">Mannschaften</h3>
              <div className="mt-4 space-y-4">
                {values.assignedTeams?.map((assignment, assignmentIndex) => (
                  <div key={assignmentIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">{assignment.clubName}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newAssignedTeams = values.assignedTeams.filter((_, idx) => idx !== assignmentIndex);
                          setFieldValue('assignedTeams', newAssignedTeams);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove Club
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      {assignment.teams.map((team, teamIndex) => (
                        <div key={teamIndex} className="flex items-center gap-2 mt-2">
                          <span>{team.teamName}</span>
                          <InputText
                            name={`assignedTeams.${assignmentIndex}.teams.${teamIndex}.jerseyNo`}
                            type="number"
                            label="Trikotnummer"
                            className="w-24"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newTeams = assignment.teams.filter((_, idx) => idx !== teamIndex);
                              setFieldValue(`assignedTeams.${assignmentIndex}.teams`, newTeams);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <AddTeamSection
                  values={values}
                  setFieldValue={setFieldValue}
                  jwt={jwt}
                />
              </div>
            </div>
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

