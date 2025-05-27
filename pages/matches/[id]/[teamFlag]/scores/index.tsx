import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { Match, RosterPlayer, Team, ScoresBase } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import MatchHeader from '../../../../../components/ui/MatchHeader';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import ButtonPrimary from '../../../../../components/ui/form/ButtonPrimary';
import ButtonLight from '../../../../../components/ui/form/ButtonLight';
import PlayerSelect from '../../../../../components/ui/PlayerSelect';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [match, setMatch] = useState<Match>(initialMatch);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  // Refresh match data function
  const handleRefreshMatch = useCallback(async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`);
      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing match data:', error);
      setIsRefreshing(false);
    }
  }, [id, isRefreshing]);

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
  /*
  const validationSchema = Yup.object({
    Yup.array().of(
      Yup.object().shape({
        player: Yup.string().required('Spieler ist erforderlich'),
        assist: Yup.string().nullable(), // Optional
        time: Yup.number()
          .min(0, 'Zeit muss positiv sein')
          .max(120, 'Zeit darf nicht über 120 Minuten sein')
          .required('Zeit ist erforderlich')
      })
    )
  });
  */
  // Form submission
  const onSubmit = async (values: ScoresBase[]) => {
    if (!match._id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/matches/${match._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ values }),
      });

      if (!response.ok) {
        throw new Error('Failed to save the goal sheet');
      }

      setSuccessMessage('Tore wurden erfolgreich gespeichert');
      console.log('Goal sheet saved successfully');
    } catch (error) {
      console.error('An error occurred:', error);
      setError('Fehler beim Speichern der Tore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-4">
        <button
          aria-label="Back button"
          className="flex items-center"
          onClick={() => router.back()}>
          <ChevronLeftIcon aria-hidden="true" className="h-3 w-3 text-gray-400" />
          <span className="ml-2 text-sm font-base text-gray-500 hover:text-gray-700">
            Zurück
          </span>
        </button>

        <MatchHeader
          match={match}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshMatch}
        />

        <h1 className="text-2xl font-bold mb-6">Tore: {team?.fullName} / {team?.name}</h1>

        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
        {error && <ErrorMessage error={error} onClose={handleCloseErrorMessage} />}

        <Formik
          initialValues={initialScores}
          //validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ values, errors, touched }) => (
            <Form>
              <FieldArray name="scores">
                {({ remove, push }) => (
                  <div className="space-y-6">
                    {values.map((score, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Tor {index + 1}</h3>
                          {values.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Entfernen
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Player Selection */}
                          <PlayerSelect
                            name={`goals.${index}.player`}
                            id={`goals.${index}.player`}
                            selectedPlayer={score.goalPlayer}
                            onChange={(e) => {
                              values[index].goalPlayer = e.target.value;
                            }}
                            roster={roster}
                            required={true}
                            error={
                              errors[index]?.goalPlayer && touched[index]?.goalPlayer
                                ? errors[index]?.goalPlayer
                                : undefined
                            }
                            placeholder="Torschützen auswählen"
                          />

                          {/* Assist Selection */}
                          <PlayerSelect
                            name={`goals.${index}.assist`}
                            id={`goals.${index}.assist`}
                            selectedPlayer={score.assistPlayer}
                            onChange={(e) => {
                              values[index].assistPlayer = e.target.value;
                            }}
                            roster={roster}
                            required={false}
                            placeholder="Keine Vorlage"
                          />
                        </div>

                        {/* Time Input */}
                        <div>
                          <label
                            htmlFor={`goals.${index}.time`}
                            className="block text-sm font-medium leading-6 text-gray-900 mb-2"
                          >
                            Zeit (min) *
                          </label>
                          <input
                            type="number"
                            name={`goals.${index}.time`}
                            id={`goals.${index}.time`}
                            min="0"
                            max="120"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={goal.time}
                            onChange={(e) => {
                              values[index].matchTime = e.target.value;
                            }}
                          />
                          {errors[index]?.matchTime && touched[index]?.matchTime && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors[index]?.matchTime}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => push({ player: '', assist: '', time: '' })}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Weiteres Tor hinzufügen
                      </button>
                    </div>
                  </div>
                )}
              </FieldArray>

              <div className="mt-8 flex justify-end py-4 space-x-3">
                <ButtonLight
                  name="btnCancel"
                  type="button"
                  onClick={() => router.back()}
                  label="Abbrechen"
                />
                <ButtonPrimary
                  name="btnSubmit"
                  type="submit"
                  label="Tore speichern"
                  loading={loading}
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Layout>
  );
};

export default GoalRegisterForm;