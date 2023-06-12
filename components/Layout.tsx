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
      <main className="mx-auto max-w-7xl p-2 sm:px-4 md:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
