import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LayoutAdm({
  children, 
  sidebar,
  sectionHeader,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  sectionHeader: React.ReactNode
}) {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="min-h-screen relative">
        <div className="mx-auto max-w-screen-xl pb-6 lg:pb-16">
          <div className="overflow-hidden">
            <div className="divide-y divide-gray-200 md:grid md:grid-cols-12 md:divide-y-0 md:divide-x">
              {sidebar}
              {sectionHeader}
              <main className="px-4 md:px-8 py-6 md:col-span-9 flex-auto clear-left">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
};
