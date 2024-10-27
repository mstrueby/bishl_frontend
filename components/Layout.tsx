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
    <div className="">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Header />
      <main className="min-h-screen mx-auto max-w-7xl mt-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
