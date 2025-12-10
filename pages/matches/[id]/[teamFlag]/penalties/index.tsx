
import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import usePermissions from '../../../../../hooks/usePermissions';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Match, RosterPlayer, EventPlayer, Team, PenaltiesBase } from '../../../../../types/MatchValues';
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
import PenaltyCodeSelect from '../../../../../components/ui/PenaltyCodeSelect';
import Listbox from '../../../../../components/ui/form/Listbox';
import Toggle from '../../../../../components/ui/form/Toggle';
import SectionHeader from '../../../../../components/admin/SectionHeader';
import { calculateMatchButtonPermissions } from '../../../../../tools/utils';
import apiClient from '../../../../../lib/apiClient';
import { getErrorMessage } from '../../../../../lib/errorHandler';

let BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type PenaltyCode = {
  key: string;
  value: string;
}

const penaltyMinuteOptions = [
  { key: '2', value: '2' },
  { key: '5', value: '5' },
  { key: '10', value: '10' },
  { key: '20', value: '20' }
];

const PenaltyRegisterForm = () => {
  const router = useRouter();
  const { id, teamFlag } = router.query as { id: string; teamFlag: string };
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();

  const [pageLoading, setPageLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [initialPenalties, setInitialPenalties] = useState<PenaltiesBase[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [penaltyCodes, setPenaltyCodes] = useState<PenaltyCode[]>([]);

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  // Fetch penalty codes on component mount
  useEffect(() => {
    const fetchPenaltyCodes = async () => {
      try {
        const response = await apiClient.get('/configs/penaltycode');
        const data = response.data.value;
        if (Array.isArray(data) && data.length > 0) {
          const filteredData = data.map(({ key, value }) => ({ key, value }));
          setPenaltyCodes(filteredData);
        } else {
          console.error('Invalid penalty codes data format:', data);
          setPenaltyCodes([]);
        }
      } catch (error) {
        console.error('Error fetching penalty codes:', getErrorMessage(error));
        setPenaltyCodes([]);
      }
    };

    fetchPenaltyCodes();
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    if (authLoading || !user || !id || !teamFlag) return;

    const fetchData = async () => {
      try {
        setPageLoading(true);

        // Fetch match data
        const matchResponse = await apiClient.get(`/matches/${id}`);
        const matchData: Match = matchResponse.data;
        setMatch(matchData);

        const matchTeam: Team = teamFlag === 'home' ? matchData.home : matchData.away;
        setTeam(matchTeam);
        setRoster(matchTeam.roster || []);
        setInitialPenalties(matchTeam.penalties || []);

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
    showButtonPenaltiesHome: false,
    showButtonPenaltiesAway: false
  };
  const hasPenaltiesPermission = teamFlag === 'home' ? permissions.showButtonPenaltiesHome : permissions.showButtonPenaltiesAway;

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
    penalties: Yup.array().of(
      Yup.object().shape({
        matchTimeStart: Yup.string()
          .required()
          .matches(/^\d{1,3}:\d{2}$/, 'Zeit muss im Format MM:SS sein')
          .test('valid-seconds', 'Sekunden müssen zwischen 00-59 sein', function(value) {
            if (!value || !value.includes(':')) return false;
            const [minutes, seconds] = value.split(':');
            const secondsNum = parseInt(seconds, 10);
            return secondsNum >= 0 && secondsNum <= 59;
          }),
        matchTimeEnd: Yup.string()
          .matches(/^(\d{1,3}:\d{2})?$/, 'Zeit muss im Format MM:SS sein oder leer bleiben')
          .test('valid-seconds', 'Sekunden müssen zwischen 00-59 sein', function(value) {
            if (!value || value === '' || !value.includes(':')) return true;
            const [minutes, seconds] = value.split(':');
            const secondsNum = parseInt(seconds, 10);
            return secondsNum >= 0 && secondsNum <= 59;
          })
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
  const onSubmit = async (penalties: any[]) => {
    if (!match?._id) return;

    setLoading(true);
    setError(null);

    const processedPenalties: PenaltiesBase[] = penalties.map(penalty => ({
      ...penalty,
      penaltyMinutes: Number(penalty.penaltyMinutes)
    }));

    const sortedPenalties = [...processedPenalties].sort((a, b) => {
      const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return 0;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
      };
      return timeToSeconds(a.matchTimeStart) - timeToSeconds(b.matchTimeStart);
    });

    const payload = {
      [teamFlag]: {
        penalties: sortedPenalties
      }
    };

    try {
      const response = await apiClient.patch(`/matches/${match._id}`, payload);

      if (response.status === 304) {
        setSuccessMessage('Keine Änderungen erforderlich');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSuccessMessage('Strafen wurden erfolgreich gespeichert');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('An error occurred:', getErrorMessage(error));
      setError('Fehler beim Speichern der Strafen');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <Layout>
        <LoadingState message="Lade Strafen..." />
      </Layout>
    );
  }

  // Return null while redirecting
  if (!user) {
    return null;
  }

  // Check permissions after loading
  if (!hasPenaltiesPermission) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nicht berechtigt</h2>
            <p className="text-gray-500 mb-4">Sie haben keine Berechtigung, die Strafen für diese Mannschaft zu bearbeiten.</p>
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

  return (
    <Layout>
      <Link href={`/matches/${match._id}/matchcenter?tab=penalties`} className="flex items-center" aria-label="Back to Match Center">
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
        <SectionHeader title="Strafen" description={`${team?.fullName} / ${team?.name}`} descriptionLogoUrl={team?.logo} />
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

                              <div className="hidden md:block w-8 text-center">
                                <span className="text-gray-500">{index + 1}</span>
                              </div>

                              <div className="flex flex-initial flex-row md:flex-col md:w-28 gap-4">
                                <div className="justify-center md:justify-start w-full">
                                  <InputMatchTime
                                    name={`penalties.${index}.matchTimeStart`}
                                    tabIndex={index * 6 + 1}
                                    ref={(el: HTMLInputElement | null) => {
                                      inputRefs.current[index] = el;
                                    }}
                                  />
                                </div>
                                <div className="justify-center md:justify-start w-full">
                                  <InputMatchTime
                                    name={`penalties.${index}.matchTimeEnd`}
                                    tabIndex={index * 6 + 2}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-auto flex-col gap-4">
                                <EventPlayerSelect
                                  name={`penalties.${index}.penaltyPlayer`}
                                  selectedPlayer={penalty.penaltyPlayer || null}
                                  onChange={(eventPlayer) => {
                                    setFieldValue(`penalties.${index}.penaltyPlayer`, eventPlayer);
                                  }}
                                  roster={sortedRoster}
                                  required={true}
                                  placeholder="Spieler auswählen"
                                  showErrorText={false}
                                  tabIndex={index * 6 + 3}
                                />
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
                                  required={true}
                                  placeholder="Strafe auswählen"
                                  showErrorText={false}
                                  tabIndex={index * 6 + 4}
                                />
                              </div>

                              <div className=" flex flex-col w-full md:w-48 gap-4">
                                <div className="w-full md:flex-auto">
                                  <Listbox
                                    name={`penalties.${index}.penaltyMinutes`}
                                    options={penaltyMinuteOptions}
                                    placeholder="Strafminuten"
                                    showErrorText={false}
                                    tabIndex={index * 6 + 5}
                                  />
                                </div>
                                <div className="flex flex-row items-center justify-end md:justify-between p-2 gap-6 -mt-6 -mb-2">
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

                    <div className="flex justify-end space-x-3 pt-8">
                      <Link href={`/matches/${match._id}/matchcenter?tab=penalties`} className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" tabIndex={values.penalties.length * 6 + 10}>
                        Schließen
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
    </Layout>
  );
};

export default PenaltyRegisterForm;
