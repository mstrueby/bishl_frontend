import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputText from "../components/ui/form/InputText";
import ButtonPrimary from "../components/ui/form/ButtonPrimary";
import {
  XCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import apiClient from "../lib/apiClient";

const validationSchema = Yup.object({
  password: Yup.string()
    .required("Bitte gib ein neues Passwort ein.")
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
  confirmPassword: Yup.string()
    .required("Bitte bestätige dein Passwort.")
    .oneOf([Yup.ref("password")], "Die Passwörter stimmen nicht überein."),
});

const ResetPasswordPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      setError(
        "Kein gültiger Token vorhanden. Bitte fordere einen neuen Link an.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/users/reset-password", {
        token: token as string,
        password: values.password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Ein Fehler ist aufgetreten. Der Link ist möglicherweise abgelaufen.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token && typeof window !== "undefined" && router.isReady) {
    return (
      <>
        <Head>
          <title>Passwort zurücksetzen | BISHL</title>
        </Head>
        <Layout>
          <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon
                      className="h-5 w-5 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      Ungültiger oder fehlender Token. Bitte fordere einen neuen
                      Link an.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  Neuen Link anfordern
                </Link>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Passwort zurücksetzen | BISHL</title>
      </Head>

      <Layout>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="flex justify-center">
              <Image
                src="https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                alt="BISHL"
                width={64}
                height={59}
              />
            </div>
            <h2 className="mt-6 text-center text-2xl leading-9 tracking-tight text-gray-900">
              Neues Passwort setzen
            </h2>
          </div>

          {error && (
            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                    onClick={() => setError(null)}
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {success ? (
            <>
              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon
                      className="h-5 w-5 text-green-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Dein Passwort wurde erfolgreich zurückgesetzt.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  Zur Anmeldung
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
              <Formik
                initialValues={{ password: "", confirmPassword: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                <Form className="space-y-6">
                  <InputText
                    name="password"
                    type="password"
                    label="Neues Passwort"
                    autoComplete="new-password"
                  />
                  <InputText
                    name="confirmPassword"
                    type="password"
                    label="Passwort bestätigen"
                    autoComplete="new-password"
                  />
                  <div className="mt-4 flex justify-end py-4">
                    <ButtonPrimary
                      name="btnSubmit"
                      type="submit"
                      label="Passwort speichern"
                      className="w-full"
                      isLoading={loading}
                    />
                  </div>
                </Form>
              </Formik>

              <div className="mt-6 text-center text-sm text-gray-500">
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default ResetPasswordPage;
