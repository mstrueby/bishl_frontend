import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { buildUrl } from 'cloudinary-build-url'
import LayoutAdm from '../../../components/LayoutAdm';
import Badge from '../../../components/ui/Badge';
import { ClubFormValues } from '../../../types/ClubFormValues';
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { navData } from '../../../components/leaguemanager/navData';


const transformedUrl = (id) => buildUrl(id, {
  cloud: {
    cloudName: 'dajtykxvp',
  },
  transformations: {
    effect: {
      name: 'grayscale',
    },
    //effect: {
    //  name: 'tint',
    //  value: '60:blue:white'
    //}
  }
});

export default function Clubs({
  allClubsData
}: {
  allClubsData: ClubFormValues[];
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
      sectionTitle='Vereine'
      newLink={`/leaguemanager/clubs/add`}
    >
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">

          {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Verein
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

                  {allClubsData && allClubsData.map((club) => {
                    return (
                      <tr key={club.name}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-4">
                              <Image className="h-10 w-10 rounded-full"
                                src={club.logo ?
                                  transformedUrl(club.logo) :
                                  transformedUrl('https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png')}
                                alt={club.name}
                                objectFit="contain" height={50} width={50}
                              />
                            </div>
                            <div className="font-medium text-gray-900">{club.name}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                          <Badge info={club.active === true ? 'aktiv' : 'inaktiv'} />
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/leaguemanager/clubs/${club.alias}/edit`}>
                            <a className="text-indigo-600 hover:text-indigo-900">Bearbeiten<span className="sr-only">, {club.name}</span></a>
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

    </LayoutAdm>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clubs/`);
  const allClubsData = await res.json();

  return {
    props: {
      allClubsData,
      revalidate: 60,
    },
  };
};

