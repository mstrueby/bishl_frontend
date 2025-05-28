import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { Match, RosterPlayer, EventPlayer, Team, ScoresBase } from '../../../../../types/MatchValues';
import Layout from '../../../../../components/Layout';
import ErrorMessage from '../../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../../components/ui/SuccessMessage';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import MatchHeader from '../../../../../components/ui/MatchHeader';
import { Formik, Form, FieldArray, FieldArrayRenderProps } from 'formik';
import * as Yup from 'yup';
import ButtonPrimary from '../../../../../components/ui/form/ButtonPrimary';
import ButtonLight from '../../../../../components/ui/form/ButtonLight';
import PlayerSelect from '../../../../../components/ui/PlayerSelect';
import InputMatchTime from '../../../../../components/ui/form/InputMatchTime';

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
          initialValues={{ scores: initialScores }}
          //validationSchema={validationSchema}
          onSubmit={(values) => onSubmit(values.scores)}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <FieldArray
                name="scores"
                render={({ remove, push }: FieldArrayRenderProps) => (
                  <div className="space-y-6">
                    {values.scores.map((score, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Tor {index + 1}</h3>
                          {values.scores.length > 1 && (
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
                          />

                          {/* Assist Selection */}
                          <PlayerSelect
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
                          />
                        </div>

                        {/* Time Input */}
                        <InputMatchTime
                          name={`scores.${index}.matchTime`}
                          label="Zeit (mm:ss) *"
                          description="Geben Sie die Zeit im Format mm:ss ein (z.B. 15:30)"
                        />
                      </div>
                    ))}

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => push({
                          matchTime: '',
                          goalPlayer: null,
                          assistPlayer: null,
                          isPPG: false,
                          isSHG: false,
                          isGWG: false
                        })}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Weiteres Tor hinzufügen
                      </button>
                    </div>


                    <div className="mt-8 flex justify-end space-x-3">
                      <ButtonLight
                        name="btnCancel"
                        type="button"
                        onClick={() => router.back()}
                        label="Abbrechen"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      />
                      <ButtonPrimary
                        name="btnSubmit"
                        type="submit"
                        label="Speichern"
                        isLoading={loading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      />
                    </div>
                  </div>
                )}
              />
            </Form>
          )}
        </Formik>
      </div>
    </Layout >
  );
};

export default GoalRegisterForm;