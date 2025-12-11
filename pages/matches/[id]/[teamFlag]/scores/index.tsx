import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MatchValues, RosterPlayer, EventPlayer, Team, ScoresBase } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import LoadingState from '../../../../../components/ui/LoadingState';
import { ChevronLeftIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import MatchHeader from '../../../../../components/ui/MatchHeader';
import { Formik, Form, FieldArray, FieldArrayRenderProps } from 'formik';
import * as Yup from 'yup';
import ButtonPrimary from '../../../../../components/ui/form/ButtonPrimary';
import EventPlayerSelect from '../../../../../components/ui/EventPlayerSelect';
import InputMatchTime from '../../../../../components/ui/form/InputMatchTime';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { calculateMatchButtonPermissions } from '../../../../../tools/utils';
import apiClient from '../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../lib/errorHandler';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const GoalRegisterForm = () => {
  const router = useRouter();
  const { id, teamFlag } = router.query as { id: string; teamFlag: string };
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();

  const [pageLoading, setPageLoading] = useState(true);
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [initialScores, setInitialScores] = useState<ScoresBase[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const goalPlayerRefs = useRef<{ [key: number]: any }>({});
  const assistPlayerRefs = useRef<{ [key: number]: any }>({});
  const addGoalButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  // Fetch all data on mount
  useEffect(() => {
    if (authLoading || !user || !id || !teamFlag) return;

    const fetchData = async () => {
      try {
        setPageLoading(true);

        // Fetch match data
        const matchResponse = await apiClient.get(`/matches/${id}`);
        const matchData: MatchValues = matchResponse.data;
        setMatch(matchData);

        const matchTeam: Team = teamFlag === 'home' ? matchData.home : matchData.away;
        setTeam(matchTeam);
        setRoster(matchTeam.roster || []);
        setInitialScores(matchTeam.scores || []);

      } catch (error) {
        console.error('Error fetching data:', getErrorMessage(error));
        setError('Fehler beim Laden der Daten');
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, id, teamFlag]);

  // Calculate permissions
  const permissions = match && user ? calculateMatchButtonPermissions(user, match, undefined, true) : {
    showButtonScoresHome: false,
    showButtonScoresAway: false
  };
  const hasScoresPermission = teamFlag === 'home' ? permissions.showButtonScoresHome : permissions.showButtonScoresAway;

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };
  const handleCloseErrorMessage = () => {
    setError(null);
  };

  // Sort roster by jersey number
  const sortedRoster = [...roster].sort((a, b) => {
    const jerseyA = a.player.jerseyNumber || 999;
    const jerseyB = b.player.jerseyNumber || 999;
    return jerseyA - jerseyB;
  });

  // Validation schema
  const validationSchema = Yup.object({
    scores: Yup.array().of(
      Yup.object().shape({
        matchTime: Yup.string()
          .required()
          .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein')
          .test('valid-seconds', 'Sekunden müssen zwischen 00-59 sein', function(value) {
            if (!value || !value.includes(':')) return false;
            const [minutes, seconds] = value.split(':');
            const secondsNum = parseInt(seconds, 10);
            return secondsNum >= 0 && secondsNum <= 59;
          }),
        goalPlayer: Yup.object()
          .shape({
            playerId: Yup.string().required(),
            firstName: Yup.string().required(),
            lastName: Yup.string().required(),
            jerseyNumber: Yup.number().required()
          })
          .required('Torschütze ist erforderlich'),
        assistPlayer: Yup.object().nullable(),
        isPPG: Yup.boolean(),
        isSHG: Yup.boolean(),
        isGWG: Yup.boolean()
      })
    )
  });

  // Form submission
  const onSubmit = async (values: ScoresBase[]) => {
    if (!match?._id) return;

    setLoading(true);
    setError(null);

    const sortedScores = [...values].sort((a, b) => {
      const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return 0;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
      };
      return timeToSeconds(a.matchTime) - timeToSeconds(b.matchTime);
    });

    const payload = {
      [teamFlag]: {
        scores: sortedScores
      }
    };

    try {
      const response = await apiClient.patch(`/matches/${match._id}`, payload);

      if (response.status === 304) {
        setSuccessMessage('Keine Änderungen erforderlich');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSuccessMessage('Tore wurden erfolgreich gespeichert');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('An error occurred:', getErrorMessage(error));
      setError('Fehler beim Speichern der Tore');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <Layout>
        <LoadingState message="Lade Tore..." />
      </Layout>
    );
  }

  // Return null while redirecting
  if (!user) {
    return null;
  }

  // Check permissions after loading
  if (!hasScoresPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nicht berechtigt</h2>
            <p className="text-gray-500 mb-4">Sie haben keine Berechtigung, die Tore für diese Mannschaft zu bearbeiten.</p>
            <Link href={match ? `/matches/${match._id}` : '/'} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Zurück zum Spiel
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match || !team) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Match not found</p>
        </div>
      </Layout>
    );
  }

  const expectedGoals = teamFlag === 'home' ? match?.home?.stats?.goalsFor || 0 : match?.away?.stats?.goalsFor || 0;

  return (
    <Layout>
      <Link href={`/matches/${match._id}/matchcenter?tab=goals`} className="flex items-center" aria-label="Back to Match Center">
        <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
        <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
          Match Center
        </span>
      </Link>

      <MatchHeader
        match={match}
        isRefreshing={false}
        onRefresh={() => { }}
      />
      <div className="mt-12">
        <SectionHeader title="Tore" description={`${team?.fullName} / ${team?.name}`} descriptionLogoUrl={team?.logo} />
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

                              <div className="hidden md:block w-8 text-center">
                                <span className="text-gray-500">{index + 1}</span>
                              </div>

                              <div className="flex flex-col md:flex-row gap-4 flex-1">
                                <div className="justify-center md:justify-start">
                                  <InputMatchTime
                                    name={`scores.${index}.matchTime`}
                                    tabIndex={index * 3 + 1}
                                    ref={(el: HTMLInputElement | null) => {
                                      inputRefs.current[index] = el;
                                    }}
                                    onKeyDown={(e: React.KeyboardEvent) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (goalPlayerRefs.current[index]) {
                                          goalPlayerRefs.current[index].focus();
                                        }
                                      }
                                    }}
                                  />
                                </div>

                                <div className="w-full md:flex-auto">
                                  <EventPlayerSelect
                                    ref={(el: any) => {
                                      goalPlayerRefs.current[index] = el;
                                    }}
                                    name={`scores.${index}.goalPlayer`}
                                    selectedPlayer={score.goalPlayer || null}
                                    onChange={(selectedEventPlayer) => {
                                      setFieldValue(`scores.${index}.goalPlayer`, selectedEventPlayer);
                                    }}
                                    roster={sortedRoster}
                                    required={true}
                                    placeholder="Torschützen auswählen"
                                    showErrorText={false}
                                    tabIndex={index * 3 + 2}
                                  />
                                </div>

                                <div className="w-full md:flex-auto">
                                  <EventPlayerSelect
                                    ref={(el: any) => {
                                      assistPlayerRefs.current[index] = el;
                                    }}
                                    name={`scores.${index}.assistPlayer`}
                                    selectedPlayer={score.assistPlayer || null}
                                    onChange={(selectedEventPlayer) => {
                                      setFieldValue(`scores.${index}.assistPlayer`, selectedEventPlayer);
                                    }}
                                    roster={sortedRoster}
                                    required={false}
                                    placeholder="Keine Vorlage"
                                    tabIndex={index * 3 + 3}
                                    removeButton={true}
                                  />
                                </div>
                              </div>

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

                    {scoresMismatch && (
                      <div className="flex items-center p-4 mb-6 text-amber-800 rounded-lg bg-amber-50 border border-amber-200">
                        <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5" aria-hidden="true" />
                        <span className="sr-only">Warnung</span>
                        <div className="ms-3 text-sm font-medium">
                          <strong>Achtung:</strong> Die Anzahl der eingetragenen Tore ({currentGoalsCount}) stimmt nicht mit dem Spielstand ({expectedGoals}) überein.
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <button
                        type="button"
                        ref={addGoalButtonRef}
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

                    <div className="flex justify-end space-x-3 pt-8">
                      <Link href={`/matches/${match._id}/matchcenter?tab=goals`} className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Schließen
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