import React, { useState, useRef } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Link from 'next/link';
import { Match, RosterPlayer, EventPlayer, Team, ScoresBase } from '../../../../../types/MatchValues';
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
import RosterPlayerSelect from '../../../../../components/ui/RosterPlayerSelect';
import InputMatchTime from '../../../../../components/ui/form/InputMatchTime';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { calculateMatchButtonPermissions } from '../../../../../tools/utils';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/*
interface Goal {
  player: string;
  assist: string;
  time: string;
}

interface GoalFormValues {
  goals: Goal[];
}
*/
interface GoalRegisterFormProps {
  jwt: string;
  match: Match;
  teamFlag: string;
  team: Team;
  initialRoster: RosterPlayer[];
  initialScores: ScoresBase[];
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
    const scores = matchTeam.scores;



    return {
      props: {
        jwt,
        match,
        teamFlag,
        team: matchTeam,
        initialRoster: roster || [],
        initialScores: scores || []
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
        initialScores: []
      }
    };
  }
};

const GoalRegisterForm: React.FC<GoalRegisterFormProps> = ({ jwt, match: initialMatch, teamFlag, team, initialRoster, initialScores }) => {
  const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Match>(initialMatch);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Calculate permissions
  const permissions = calculateMatchButtonPermissions(user, match, undefined, true);
  const hasScoresPermission = teamFlag === 'home' ? permissions.showButtonScoresHome : permissions.showButtonScoresAway;

  // Check if user has permission to access scores
  if (!hasScoresPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nicht berechtigt</h2>
            <p className="text-gray-500 mb-4">Sie haben keine Berechtigung, die Tore für diese Mannschaft zu bearbeiten.</p>
            <Link href={`/matches/${match._id}`}>
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Zurück zum Spiel
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMessage = () => {
    setError(null);
  };

  // Initial form values
  ///const initialValues: ScoresBase[] = {
  //  goals: [{ player: '', assist: '', time: '' }]
  //};

  // Validation schema
  const validationSchema = Yup.object({
    scores: Yup.array().of(
      Yup.object().shape({
        matchTime: Yup.string()
          .required()
          .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein'),
        goalPlayer: Yup.object()
          .shape({
            playerId: Yup.string().required(),
            firstName: Yup.string().required(),
            lastName: Yup.string().required(),
            jerseyNumber: Yup.number().required()
          })
          .required('Torschütze ist erforderlich')
          .nullable(),
        assistPlayer: Yup.object().nullable(), // Optional
        isPPG: Yup.boolean(),
        isSHG: Yup.boolean(),
        isGWG: Yup.boolean()
      })
    )
  });

  // Form submission
  const onSubmit = async (values: ScoresBase[]) => {
    if (!match._id) return;

    setLoading(true);
    setError(null);

    // Sort scores by matchTime before submitting
    const sortedScores = [...values].sort((a, b) => {
      // Convert time strings to comparable format (mm:ss -> minutes * 60 + seconds)
      const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return 0;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
      };
      return timeToSeconds(a.matchTime) - timeToSeconds(b.matchTime);
    });

    // Structure the payload with teamFlag
    const payload = {
      [teamFlag]: {
        scores: sortedScores
      }
    };

    console.log("submitted payload", payload);

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
        throw new Error('Failed to save the goal sheet');
      }

      setSuccessMessage('Tore wurden erfolgreich gespeichert');
      console.log('Goal sheet saved successfully');

      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('An error occurred:', error);
      setError('Fehler beim Speichern der Tore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Link href={`/matches/${match._id}/matchcenter?tab=goals`}>
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
        <SectionHeader title="Tore" description={`${team?.fullName} / ${team?.name}`} />
      </div>

      <div className="sm:px-3 pb-2">
        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
        {error && <ErrorMessage error={error} onClose={handleCloseErrorMessage} />}
      </div>

      <Formik
        initialValues={{ scores: initialScores || [] }}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit(values.scores)}
      >
        {({ values, errors, touched, setFieldValue }) => {
          const expectedGoals = teamFlag === 'home' ? match?.home?.stats?.goalsFor || 0 : match?.away?.stats?.goalsFor || 0;
          const currentGoalsCount = values.scores.length;
          const scoresMismatch = currentGoalsCount !== expectedGoals;

          return (
            <Form>
              <FieldArray
                name="scores"
                render={({ remove, push }: FieldArrayRenderProps) => (
                  <div className="space-y-6 sm:px-0">
                    <div className="divide-y divide-gray-200 shadow rounded-md border">
                      {values.scores.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">Keine Tore vorhanden.</p>
                        </div>
                      ) : (
                        values.scores.map((score, index) => (
                          <div key={index} className="p-3">
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                              {/* Mobile header with index and remove button */}
                              <div className="flex items-center justify-between md:hidden">
                                <span className="font-medium text-gray-700">Tor #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Tor entfernen"
                                >
                                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </div>

                              {/* Desktop index (hidden on mobile) */}
                              <div className="hidden md:block w-8 text-center">
                                <span className="text-gray-500">{index + 1}</span>
                              </div>

                              {/* Form fields container */}
                              <div className="flex flex-col md:flex-row gap-4 flex-1">
                                {/* Time Input */}
                                <div className="justify-center md:justify-start">
                                  <InputMatchTime
                                    name={`scores.${index}.matchTime`}
                                    tabIndex={index * 3 + 1}
                                    ref={(el: HTMLInputElement | null) => {
                                      inputRefs.current[index] = el;
                                    }}
                                  />
                                </div>

                                {/* Scores Selection */}
                                <div className="w-full md:flex-auto">
                                  <RosterPlayerSelect
                                    name={`scores.${index}.goalPlayer`}
                                    selectedPlayer={score.goalPlayer ? roster.find(rp => rp.player.playerId === score.goalPlayer.playerId) || null : null}
                                    onChange={(selectedRosterPlayer) => {
                                      if (selectedRosterPlayer) {
                                        setFieldValue(`scores.${index}.goalPlayer`, {
                                          playerId: selectedRosterPlayer.player.playerId,
                                          firstName: selectedRosterPlayer.player.firstName,
                                          lastName: selectedRosterPlayer.player.lastName,
                                          jerseyNumber: selectedRosterPlayer.player.jerseyNumber
                                        });
                                      } else {
                                        setFieldValue(`scores.${index}.goalPlayer`, null);
                                      }
                                    }}
                                    roster={roster}
                                    required={true}
                                    placeholder="Torschützen auswählen"
                                    showErrorText={false}
                                    tabIndex={index * 3 + 2}
                                  />
                                </div>

                                {/* Assist Selection */}
                                <div className="w-full md:flex-auto">
                                  <RosterPlayerSelect
                                    name={`scores.${index}.assistPlayer`}
                                    selectedPlayer={score.assistPlayer ? roster.find(rp => rp.player.playerId === score.assistPlayer?.playerId) || null : null}
                                    onChange={(selectedRosterPlayer) => {
                                      if (selectedRosterPlayer) {
                                        setFieldValue(`scores.${index}.assistPlayer`, {
                                          playerId: selectedRosterPlayer.player.playerId,
                                          firstName: selectedRosterPlayer.player.firstName,
                                          lastName: selectedRosterPlayer.player.lastName,
                                          jerseyNumber: selectedRosterPlayer.player.jerseyNumber
                                        });
                                      } else {
                                        setFieldValue(`scores.${index}.assistPlayer`, null);
                                      }
                                    }}
                                    roster={roster}
                                    required={false}
                                    placeholder="Keine Vorlage"
                                    tabIndex={index * 3 + 3}
                                    removeButton={true}
                                  />
                                </div>
                              </div>

                              {/* Desktop remove button (hidden on mobile) */}
                              <div className="hidden md:flex flex-none">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Tor entfernen"
                                >
                                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Score mismatch indicator */}
                    {scoresMismatch && (
                      <div className="flex items-center p-4 mb-6 text-amber-800 rounded-lg bg-amber-50 border border-amber-200">
                        <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5" aria-hidden="true" />
                        <span className="sr-only">Warnung</span>
                        <div className="ms-3 text-sm font-medium">
                          <strong>Achtung:</strong> Die Anzahl der eingetragenen Tore ({currentGoalsCount}) stimmt nicht mit dem Spielstand ({expectedGoals}) überein.
                        </div>
                      </div>
                    )}

                    {/* add score */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        tabIndex={values.scores.length * 3 + 1}
                        onClick={() => {
                          const newIndex = values.scores.length;
                          push({
                            matchTime: '',
                            goalPlayer: null,
                            assistPlayer: null,
                            isPPG: false,
                            isSHG: false,
                            isGWG: false
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
                        Tor hinzufügen
                      </button>
                    </div>

                    {/* buttons */}
                    <div className="flex justify-end space-x-3 pt-8">
                      <Link href={`/matches/${match._id}/matchcenter?tab=goals`}>
                        <a className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          Schließen
                        </a>
                      </Link>
                      <ButtonPrimary
                        name="btnSubmit"
                        type="submit"
                        label="Speichern"
                        isLoading={loading}
                        tabIndex={values.scores.length * 3 + 2}
                      />
                    </div>
                  </div>
                )}
              />
            </Form>
          );
        }}
      </Formik>
    </Layout>
  );
};

export default GoalRegisterForm;