import { AppProps } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import ProgressBar from '@badrap/bar-of-progress'
import { AuthProvider } from '../context/AuthContext';
import DemoWarmup from '../components/ui/DemoWarmup';
import '../styles/globals.css'

const progress = new ProgressBar({
  size: 4,
  color: '#c20c0c',
  className: 'nav-progress-bar',
  delay: 80,
});

Router.events.on('routeChangeStart', progress.start);
Router.events.on('routeChangeComplete', progress.finish);
Router.events.on('routeChangeError', progress.finish);

const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {isDemo && (
        <>
          <Head>
            <meta name="robots" content="noindex, nofollow" />
          </Head>
          <DemoWarmup />
        </>
      )}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
