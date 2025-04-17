import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect any non-root paths to home
    if (router.pathname !== '/') {
      router.push('/');
    }
  }, [router.pathname]);

  return (
    <>
      <Head>
        <title>BISHL - Bundesliga Inline-Skaterhockey</title>
      </Head>
      <Layout>
        <div className="bg-white">
          <div className="relative isolate px-6 pt-14 lg:px-8">
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Bundesliga Inline-Skaterhockey
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Die offizielle Website der Bundesliga Inline-Skaterhockey Deutschland
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <a
                    href="#"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Mehr erfahren
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}