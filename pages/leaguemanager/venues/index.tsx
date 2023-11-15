import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import LayoutAdm from '../../../components/LayoutAdm';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import Badge from '../../../components/ui/Badge';
import Pagination from '../../../components/ui/Pagination';
import { useState, useEffect } from "react";

export interface VenueFormValues {
  _id: string;
  name: string;
  alias: string;
  shortName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  active: boolean;
}


export default function Venues({
  allVenuesData
}: {
  allVenuesData: VenueFormValues[]
}) {
  const [currentPage, setCurrentPage] = useState(1);
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

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Spielflächen',
          newLink: `/leaguemanager/venues/add`
        }}
      />

      {/* start table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">

          {successMessage &&
            <div className="border-l-4 border-green-400 rounded-md bg-green-50 p-4 mb-4 md:mx-6 lg:mx-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                      onClick={handleCloseSuccessMessage}
                    >
                      <span className="sr-only">Dismiss</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

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

                  {allVenuesData && allVenuesData.map(({ _id, alias, name, street, zipCode, city, active }) => {
                    return (

                      <tr key={name}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="">
                              <div className="font-medium text-gray-900">{name}</div>
                              <div className="text-gray-500">{street}, {zipCode} {city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                          <Badge info={active === true ? 'aktiv' : 'inaktiv'} />
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/leaguemanager/venues/${alias}/edit`}>
                            <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {name}</span></a>
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
        </div>
      </div>

      {/*       <Pagination 
        items={allVenuesData.length} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
      /> */}

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