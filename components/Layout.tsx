import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Layout({
  children,
  home
}: {
  children: React.ReactNode
  home?: boolean
}) {

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />
      <main className="flex-grow w-full mx-auto max-w-7xl my-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
