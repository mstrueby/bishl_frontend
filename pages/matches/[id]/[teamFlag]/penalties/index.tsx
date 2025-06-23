import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Link from 'next/link';
import { Match, RosterPlayer, EventPlayer, Team, PenaltiesBase } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import { ChevronLeftIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import MatchHeader from '../../../../../components/ui/MatchHeader';
import { Formik, Form, FieldArray, FieldArrayRenderProps } from 'formik';
import * as Yup from 'yup';
import ButtonPrimary from '../../../../../components/ui/form/ButtonPrimary';
import ButtonLight from '../../../../../components/ui/form/ButtonLight';
import PlayerSelect from '../../../../../components/ui/PlayerSelect';
import InputMatchTime from '../../../../../components/ui/form/InputMatchTime';
import PenaltyCodeSelect from '../../../../../components/ui/PenaltyCodeSelect';
import Listbox from '../../../../../components/ui/form/Listbox';
import Toggle from '../../../../../components/ui/form/Toggle';
import SectionHeader from '../../../../../components/admin/SectionHeader';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PenaltyRegisterFormProps {
  jwt: string;
  match: Match;
  teamFlag: string;
  team: Team;
  initialRoster: RosterPlayer[];
  initialPenalties: PenaltiesBase[];
}

interface PenaltyCode {
  key: string;
  value: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, teamFlag } = context.params as { id: string; teamFlag: string };
  const jwt = getCookie('jwt', context);
  if (!jwt || !id || !teamFlag) {
    return { notFound: true };
  }

  try {
    // First check if user has required role
    const userResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const user = userResponse.data;
    if (!user.roles?.includes('ADMIN') && !user.roles?.includes('LEAGUE_ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Fetch match data
    const matchResponse = await axios.get(`${BASE_URL}/matches/${id}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      }
    });
    const match: Match = matchResponse.data;
    const matchTeam: Team = teamFlag === 'home' ? match.home : match.away;

    // Roster is obtained directly from the match data
    const roster = matchTeam.roster;
    const penalties = matchTeam.penalties;

    return {
      props: {
        jwt,
        match,
        teamFlag,
        team: matchTeam,
        initialRoster: roster || [],
        initialPenalties: penalties || []
      }
    };
  } catch (error) {
    console.error('Error fetching roster data:', error);
    return {
      props: {
        jwt,
        match: null,
        teamFlag,
        team: null,
        initialRoster: [],
        initialPenalties: []
      }
    };
  }
};

const PenaltyRegisterForm: React.FC<PenaltyRegisterFormProps> = ({ jwt, match: initialMatch, teamFlag, team, initialRoster, initialPenalties }) => {
  const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Match>(initialMatch);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);

  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMessage = () => {
    setError(null);
  };
  const fetchPenaltyCodes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/configs/penaltycode`);
      const data = response.data.value;
      if (Array.isArray(data) && data.length > 0) {
        // Ensure each item has key and value properties and remove sortOrder attribute
        const filteredData = data.map(({ key, value }) => ({ key, value }));
        setPenaltyCodes(filteredData);
      } else {
        console.error('Invalid penalty codes data format:', data);
        setPenaltyCodes([]);
      }
    } catch (error) {
      console.error('Error fetching penalty codes:', error);
      setPenaltyCodes([]);
    }
  };

  const penaltyMinuteOptions = [
    { key: '2', value: '2' },
    { key: '5', value: '5' },
    { key: '10', value: '10' },
    { key: '20', value: '20' }
  ];

  // Fetch penalty codes on component mount
  useEffect(() => {
    fetchPenaltyCodes();
  }, []);

  // Validation schema
  const validationSchema = Yup.object({
    penalties: Yup.array().of(
      Yup.object().shape({
        matchTimeStart: Yup.string()
          .required()
          .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein'),
        matchTimeEnd: Yup.string()
          .matches(/^(\d{1,3}:\d{2})?$/, 'Zeit muss im Format MM:SS sein oder leer bleiben')
          .nullable(),
        penaltyPlayer: Yup.object()
          .shape({
            playerId: Yup.string().required(),
            firstName: Yup.string().required(),
            lastName: Yup.string().required(),
            jerseyNumber: Yup.number().required()
          }).required('Spieler ist erforderlich'),
        penaltyCode: Yup.object()
          .shape({
            key: Yup.string().required(),
            value: Yup.string().required()
          }).required('Strafcode ist erforderlich'),
        penaltyMinutes: Yup.string().required('Strafminuten sind erforderlich'),
        isGM: Yup.boolean(),
        isMP: Yup.boolean(),
      })
    )
  });

  // Form submission
  const onSubmit = async (values: PenaltiesBase[]) => {
    if (!match._id) return;

    setLoading(true);
    setError(null);

    // Sort penalties by matchTimeStart before submitting
    const sortedPenalties = [...values].sort((a, b) => {
      // Convert time strings to comparable format (mm:ss -> minutes * 60 + seconds)
      const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return 0;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
      };
      return timeToSeconds(a.matchTimeStart) - timeToSeconds(b.matchTimeStart);
    });

    // Structure the payload with teamFlag
    const payload = {
      [teamFlag]: {
        penalties: sortedPenalties
      }
    };

    console.log("submitted payload", payload)

    try {
      const response = await fetch(`${BASE_URL}/matches/${match._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });

      // Ignore 304 Not Modified status - no changes needed
      if (response.status === 304) {
        setSuccessMessage('Keine Änderungen erforderlich');
        console.log('No changes needed (304)');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save the penalty sheet');
      }

      setSuccessMessage('Strafen wurden erfolgreich gespeichert');
      console.log('Penalty sheet saved successfully');

      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('An error occurred:', error);
      setError('Fehler beim Speichern der Strafen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-4">
        <Link href={`/matches/${match._id}/matchcenter?tab=penalties`}>
          <a className="flex items-center" aria-label="Back to Match Center">
            <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
            <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
              Match Center
            </span>
          </a>
        </Link>

        <MatchHeader
          match={match}
          isRefreshing={false}
          onRefresh={() => { }}
        />
        <div className="mt-12">
          <SectionHeader title="Strafen" description={`${team?.fullName} / ${team?.name}`} />
        </div>

        <div className="sm:px-3 pb-2">
          {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
          {error && <ErrorMessage error={error} onClose={handleCloseErrorMessage} />}
        </div>

        <Formik
          initialValues={{
            penalties: initialPenalties?.map(penalty => ({
              ...penalty,
              penaltyMinutes: penalty.penaltyMinutes ? String(penalty.penaltyMinutes) : ''
            })) || []
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => onSubmit(values.penalties)}
        >
          {({ values, errors, touched, setFieldValue }) => {
            return (
              <Form>
                <FieldArray
                  name="penalties"
                  render={({ remove, push }: FieldArrayRenderProps) => (
                    <div className="space-y-6 sm:px-0">
                      <div className="divide-y divide-gray-200 shadow rounded-md border">
                        {values.penalties.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">Keine Strafen vorhanden.</p>
                          </div>
                        ) : (
                          values.penalties.map((penalty, index) => (
                            <div key={index} className="px-3 py-6 md:py-6">
                              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                {/** mobile header with index and remove button */}
                                <div className="flex items-center justify-between md:hidden">
                                  <span className="font-medium text-gray-700">Strafe #{index + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Strafe entfernen"
                                  >
                                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                  </button>
                                </div>

                                {/** desktop index (hidden on mobile) */}
                                <div className="hidden md:block w-8 text-center">
                                  <span className="text-gray-500">{index + 1}</span>
                                </div>

                                {/** form fields container */}
                                {/** Start End Time */}
                                <div className="flex flex-initial flex-row md:flex-col md:w-28 gap-4">
                                  {/** Time Input - Start */}
                                  <div className="justify-center md:justify-start w-full">
                                    <InputMatchTime
                                      name={`penalties.${index}.matchTimeStart`}
                                      tabIndex={index * 6 + 1}
                                      ref={(el: HTMLInputElement | null) => {
                                        inputRefs.current[index] = el;
                                      }}
                                    />
                                  </div>
                                  {/** Time Input - End (Optional) */}
                                  <div className="justify-center md:justify-start w-full">
                                    <InputMatchTime
                                      name={`penalties.${index}.matchTimeEnd`}
                                      tabIndex={index * 6 + 2}
                                    />
                                  </div>
                                </div>
                                {/** Player, Code */}
                                <div className="flex flex-auto flex-col gap-4">
                                  {/** Player Selection */}
                                  <PlayerSelect
                                    name={`penalties.${index}.penaltyPlayer`}
                                    selectedPlayer={penalty.penaltyPlayer ? roster.find(rp => rp.player.playerId === penalty.penaltyPlayer.playerId) || null : null}
                                    onChange={(selectedRosterPlayer) => {
                                      if (selectedRosterPlayer) {
                                        setFieldValue(`penalties.${index}.penaltyPlayer`, {
                                          playerId: selectedRosterPlayer.player.playerId,
                                          firstName: selectedRosterPlayer.player.firstName,
                                          lastName: selectedRosterPlayer.player.lastName,
                                          jerseyNumber: selectedRosterPlayer.player.jerseyNumber
                                        });
                                      } else {
                                        setFieldValue(`penalties.${index}.penaltyPlayer`, null);
                                      }
                                    }}
                                    roster={roster}
                                    required={true}
                                    placeholder="Spieler auswählen"
                                    showErrorText={false}
                                    tabIndex={index * 6 + 3}
                                  />
                                  {/** Penalty Code Selection */}
                                  <PenaltyCodeSelect
                                    name={`penalties.${index}.penaltyCode`}
                                    selectedPenaltyCode={
                                      (penalty.penaltyCode && 'key' in penalty.penaltyCode && 'value' in penalty.penaltyCode
                                        ? penalty.penaltyCode as PenaltyCode
                                        : null)
                                    }
                                    onChange={(selectedPenaltyCode) => {
                                      setFieldValue(`penalties.${index}.penaltyCode`, selectedPenaltyCode);
                                      setError('');
                                    }}
                                    penaltyCodes={penaltyCodes}
                                    //label="Strafe"
                                    required={true}
                                    placeholder="Strafe auswählen"
                                    showErrorText={false}
                                    tabIndex={index * 6 + 4}
                                  />
                                </div>
                                {/** Minutes, GM, MP */}
                                <div className=" flex flex-col w-full md:w-48 gap-4">
                                  {/** Penalty Minutes */}
                                  <div className="w-full md:flex-auto">
                                    <Listbox
                                      name={`penalties.${index}.penaltyMinutes`}
                                      // label="Strafminuten"
                                      options={penaltyMinuteOptions}
                                      placeholder="Strafminuten"
                                      showErrorText={false}
                                      tabIndex={index * 6 + 5}
                                    />
                                  </div>
                                  {/** Penalty Type Toggles */}
                                  <div className="flex flex-row items-center justify-end md:justify-between p-2 gap-6">
                                    <Toggle
                                      name={`penalties.${index}.isGM`}
                                      label="GM"
                                      tabIndex={index * 6 + 6}
                                    />
                                    <Toggle
                                      name={`penalties.${index}.isMP`}
                                      label="MP"
                                      tabIndex={index * 6 + 7}
                                    />
                                  </div>
                                </div>

                                {/** Desktop remove button (hidden on mobile) */}
                                <div className="hidden md:flex flex-none">
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Strafe entfernen"
                                  >
                                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/** add penalty */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          tabIndex={values.penalties.length * 6 + 8}
                          onClick={() => {
                            const newIndex = values.penalties.length;
                            push({
                              matchTimeStart: '',
                              matchTimeEnd: '',
                              penaltyPlayer: null,
                              penaltyCode: null,
                              penaltyMinutes: '',
                              isGM: false,
                              isMP: false
                            });
                            // Focus on the new input after a short delay to ensure it's rendered
                            setTimeout(() => {
                              const newInput = inputRefs.current[newIndex];
                              if (newInput) {
                                newInput.focus();
                              }
                            }, 100);
                          }}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          <PlusCircleIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
                          Strafe hinzufügen
                        </button>
                      </div>

                      {/** buttons */}
                      <div className="flex justify-end space-x-3 pt-8">
                        <Link href={`/matches/${match._id}/matchcenter?tab=penalties`}>
                          <a className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" tabIndex={values.penalties.length * 6 + 10}>
                            Schließen
                          </a>
                        </Link>
                        <ButtonPrimary
                          name="btnSubmit"
                          type="submit"
                          label="Speichern"
                          isLoading={loading}
                          tabIndex={values.penalties.length * 6 + 9}
                        />
                      </div>
                    </div>
                  )}
                />
              </Form>
            );
          }}
        </Formik>
      </div>
    </Layout>
  );
};

export default PenaltyRegisterForm