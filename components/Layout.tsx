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
      <Header />
      <main className="min-h-screen mx-auto max-w-7xl sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
