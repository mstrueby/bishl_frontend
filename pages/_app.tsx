import { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css'

const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {isDemo && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

