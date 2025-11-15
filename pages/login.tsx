import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import Layout from '../components/Layout';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputText from '../components/ui/form/InputText';
import ButtonPrimary from '../components/ui/form/ButtonPrimary';
import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import apiClient from '../lib/apiClient';
import axios from 'axios';

// Assign the arrow function to a variable
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false); // State to check if running on the client

  const { setUser } = useAuth();
  const router = useRouter();

  // Moved CSRF token fetching into a useEffect hook to ensure it runs on the client
  // and before the login attempt.
  // Also, added a check for `isClient` to prevent server-side rendering issues.
  useEffect(() => {
    setIsClient(true);

    // Fetch CSRF token on component mount
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        if (data.csrfToken) {
          localStorage.setItem('csrf_token', data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCSRFToken();
  }, []);


  const handleSubmit = async () => {
    // Only proceed if running on the client and CSRF token is available
    if (!isClient || !localStorage.getItem('csrf_token')) {
      setError('CSRF token not available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Login and get tokens - call Next.js API route directly
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('csrf_token') || '',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { access_token, refresh_token } = await loginRes.json();

      // Step 2: Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 3: Fetch user info using apiClient (which automatically adds the token)
      const userRes = await apiClient.get('/users/me');
      
      // apiClient unwraps the data field automatically
      const userData = userRes.data;
      setUser(userData);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        const errMsg = error.response?.data?.error || error.response?.data?.detail || 'Login failed';
        setError(errMsg);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
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
              Melde dich an
            </h2>
          </div>

          {error && (
            <div className="mt-10 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-green-50"
                      onClick={() => setError(null)}
                    >
                      <span className="sr-only">Dismiss</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
            <Formik
              initialValues={{
                email: '',
                password: ''
              }}
              /* 
              validationSchema={Yup.object({
                email: Yup.string()
                  .required('Bitte gib eine E-Mail-Adresse ein.')
                  .email('Bitte gib eine gültige E-Mail-Adresse ein.')
                  .matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
                password: Yup.string().required('Bitte gib ein Passwort ein.')
              })
              */  

              onSubmit={handleSubmit}
            >
              <Form className="space-y-6">
                <InputText
                  name="email"
                  type="email"
                  label="E-Mail"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <InputText
                  name="password"
                  type="password"
                  label="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-4 flex justify-end py-4">
                  <ButtonPrimary
                    name="btnPrimary"
                    type="submit"
                    label="Anmelden"
                    className="w-full"
                    isLoading={loading}
                  />
                </div>
              </Form>
            </Formik>

            {/**
            <div className="mt-6 text-center text-sm text-gray-500">
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Passwort vergessen?
              </a>
            </div>
            */}
          </div>
        </div>
      </Layout>
    </>
  );
};

// Export the variable as default export
export default LoginPage;