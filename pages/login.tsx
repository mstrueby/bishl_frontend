import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import Layout from '../components/Layout';
import { Formik, Form } from 'formik';
import InputText from '../components/ui/form/InputText';
import ButtonPrimary from '../components/ui/form/ButtonPrimary';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    const res = await fetch('/api/login', {
      body: JSON.stringify({
        email,
        password
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    if (res.ok) {
      const user = await res.json();
      setUser(user);
      router.push('/');
    } else {
      // Handle error here
      const errData = await res.json();
      console.log(errData);
      setError(errData);
    }
  };

  return (
    <Layout>
      {/*<form onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button type="submit">Login</button>
      </form>
*/}

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-14 w-auto"
          src="https://bishl-frontend.marianstruby.repl.co/bishl.svg"
          alt="Your Company"
        />
        <h2 className="mt-10 text-center text-2xl leading-9 tracking-tight text-gray-900">
          Melde dich an
        </h2>
      </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">

      <Formik
  initialValues={{
    email: '',
    password: ''
  }}
  onSubmit={handleSubmit}
>

  <Form className="space-y-6">
  <InputText
    name="email"
    type="text"
    label="E-Mail"
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
    />
  </div>
  </Form>
  </Formik>

          <div className="mt-6 text-center text-sm text-gray-500">
            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Passwort vergessen?
            </a>
          </div>

        </div>        </div>


      {/*
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Melde dich mit deinem Account an
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                E-Mail Adresse
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Passwort
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Passwort vergessen?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Anmelden
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            <a href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Du hast keinen Account?
            </a>
          </p>
        </div>
      </div>
      */}
    </Layout>
  );
}
