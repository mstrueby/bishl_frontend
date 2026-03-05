import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { Formik, Form, Field, useField } from "formik";
import * as Yup from "yup";
import { PlayerValues } from "../../../types/PlayerValues";
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import ErrorMessage from "../../../components/ui/ErrorMessage";
import LoadingState from "../../../components/ui/LoadingState";
import InputText from "../../../components/ui/form/InputText";
import ImageUpload from "../../../components/ui/form/ImageUpload";
import Toggle from "../../../components/ui/form/Toggle";
import ButtonPrimary from "../../../components/ui/form/ButtonPrimary";
import ButtonLight from "../../../components/ui/form/ButtonLight";
import useAuth from "../../../hooks/useAuth";
import usePermissions from "../../../hooks/usePermissions";
import { UserRole } from "../../../lib/auth";
import apiClient from "../../../lib/apiClient";

const SexRadioGroup = () => {
  const [field, meta] = useField("sex");
  return (
    <>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Geschlecht
        </label>
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

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
      router.push("/");
    }
  }, [authLoading, user, hasAnyRole, router]);

  const initialValues: PlayerValues = {
    _id: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    displayFirstName: "",
    displayLastName: "",
    nationality: "",
    fullFaceReq: false,
    managedByISHD: false,
    assignedTeams: [],
    imageUrl: "",
    imageVisible: false,
    source: "BISHL",
    sex: "männlich",
    ageGroup: "",
    overAge: false,
    playUpTrackings: [],
    suspensions: [],
  };

  const onSubmit = async (values: PlayerValues) => {
    setError(null);
    setLoading(true);
    values.displayFirstName = values.firstName;
    values.displayLastName = values.lastName;
    values.birthdate = new Date(values.birthdate).toISOString();
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === "image" && value instanceof File) {
          formData.append("image", value);
        } else if (typeof value === "object" && key !== "imageUrl") {
          if (key === "assignedTeams") {
            const cleanedTeams = value.map(
              (club: {
                teams: { jerseyNo: number | null; [key: string]: any }[];
              }) => ({
                ...club,
                teams: club.teams.map((team) => {
                  if (team.jerseyNo === null) {
                    const { jerseyNo, ...restTeam } = team;
                    return restTeam;
                  }
                  return team;
                }),
              }),
            );
            formData.append(key, JSON.stringify(cleanedTeams));
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          if (key === "imageUrl" && value !== null) {
            formData.append(key, value);
          } else if (key !== "imageUrl") {
            formData.append(key, value);
          }
        }
      });

      const response = await apiClient.post("/players", formData);
      if (response.status === 201) {
        router.push(
          {
            pathname: "/admin/players",
            query: {
              message: `Spieler*in <strong>${values.firstName} ${values.lastName}</strong>  wurde erfolgreich angelegt.`,
            },
          },
          "/admin/players",
        );
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten.");
      }
    } catch (error: any) {
      console.error("Error adding player:", error);
      const apiError = error.response?.data?.error;
      if (apiError?.status_code === 400 && apiError?.details?.field === 'player') {
        const { firstName, lastName, birthdate } = apiError.details;
        setError(
          `Spieler*in <strong>${firstName} ${lastName}</strong> (geb. ${birthdate}) existiert bereits. ` +
          `Bitte suche den Eintrag in der <a href="/admin/players" class="underline font-semibold">Spielerliste</a>.`
        );
      } else {
        setError(apiError?.message || "Ein Fehler ist aufgetreten.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/players");
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (!hasAnyRole([UserRole.ADMIN, UserRole.LEAGUE_ADMIN])) {
    return null;
  }

  return (
    <Layout>
      <SectionHeader title="Spieler*in anlegen" />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <Formik
        initialValues={initialValues}
        enableReinitialize={false}
        validationSchema={Yup.object({
          firstName: Yup.string().required("Vorname ist erforderlich"),
          lastName: Yup.string().required("Nachname ist erforderlich"),
          birthdate: Yup.string().required("Geburtsdatum ist erforderlich"),
          sex: Yup.string().required("Geschlecht ist erforderlich"),
        })}
        onSubmit={onSubmit}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <InputText
              name="firstName"
              autoComplete="off"
              type="text"
              label="Vorname"
            />
            <InputText
              name="lastName"
              autoComplete="off"
              type="text"
              label="Nachname"
            />
            <InputText
              name="birthdate"
              autoComplete="off"
              type="date"
              label="Geburtsdatum"
            />
            <div className="mt-6 mb-2">
              <SexRadioGroup />
            </div>

            {values.imageUrl ? (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setFieldValue("imageUrl", null)}
                  className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                >
                  Bild entfernen
                </button>
              </div>
            ) : (
              <ImageUpload
                name="image"
                label="Bild"
                description="Das neue Bild wird erst nach <em>Speichern</em> hochgeladen."
                imageUrl=""
              />
            )}

            <Toggle name="imageVisible" label="Foto öffentlich anzeigen" />

            <div className="mt-4 flex justify-end py-4">
              <ButtonLight
                name="btnLight"
                type="button"
                onClick={handleCancel}
                label="Abbrechen"
              />
              <ButtonPrimary
                name="btnPrimary"
                type="submit"
                label="Speichern"
                isLoading={loading}
              />
            </div>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default Add;
