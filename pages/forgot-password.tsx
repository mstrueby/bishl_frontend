import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../components/ui/form/InputText';
import ButtonPrimary from '../components/ui/form/ButtonPrimary';
import { XCircleIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import apiClient from '../lib/apiClient';

const validationSchema = Yup.object({
  email: Yup.string()
    .required('Bitte gib eine E-Mail-Adresse ein.')
    .email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

const ForgotPasswordPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/users/forgot-password', { email: values.email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Passwort vergessen | BISHL</title>
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
              Passwort vergessen
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
            </p>
          </div>

          {error && (
            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
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
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 text-sm">
                  Zurück zur Anmeldung
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
              <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                <Form className="space-y-6">
                  <InputText
                    name="email"
                    type="email"
                    label="E-Mail"
                    autoComplete="email"
                  />
                  <div className="mt-4 flex justify-end py-4">
                    <ButtonPrimary
                      name="btnSubmit"
                      type="submit"
                      label="Link senden"
                      className="w-full"
                      isLoading={loading}
                    />
                  </div>
                </Form>
              </Formik>

              <div className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
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

export default ForgotPasswordPage;
