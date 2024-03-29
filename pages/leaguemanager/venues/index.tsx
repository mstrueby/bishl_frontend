import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LayoutAdm from '../../../components/LayoutAdm';
import Badge from '../../../components/ui/Badge';
import { VenueFormValues } from '../../../types/VenueFormValues';
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { navData } from '../../../components/leaguemanager/navData';


export default function Venues({
  allVenuesData
}: {
  allVenuesData: VenueFormValues[]
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <LayoutAdm
      navData={navData}
      sectionTitle="Spielflächen"
      newLink={`/leaguemanager/venues/add`}
    >

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      {/* start table */}
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Spielstätte
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 text-center">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Bearbeiten</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">

              {allVenuesData && allVenuesData.map((venue) => {
                return (
                  <tr key={venue.alias}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="">
                          <div className="font-medium text-gray-900">{venue.name}</div>
                          <div className="text-gray-500">{venue.street}, {venue.zipCode} {venue.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                      <Badge info={venue.active === true ? 'aktiv' : 'inaktiv'} />
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link href={`/leaguemanager/venues/${venue.alias}/edit`}>
                        <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {venue.name}</span></a>
                      </Link>
                    </td>
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/`);
  const allVenuesData = await res.json();

  return {
    props: {
      allVenuesData,
      revalidate: 60,
    },
  };
};