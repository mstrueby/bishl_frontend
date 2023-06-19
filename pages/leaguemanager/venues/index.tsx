import { GetServerSideProps } from 'next';
import Link from 'next/link';
import LayoutAdm from '../../../components/LayoutAdm';
import LmSidebar from '../../../components/leaguemanager/LmSidebar';
import SectionHeader from '../../../components/leaguemanager/SectionHeader';
import Badge from '../../../components/ui/Badge';

export default function Venues({
  allVenuesData
}: {
  allVenuesData: {
    _id: string;
    name: string;
    street: string;
    city: string;
    zipCode: string;
    active: boolean;
  }[]
}) {
  return (
    <LayoutAdm sidebar={<LmSidebar />} >
      <SectionHeader
        sectionData={{
          title: 'Spielflächen',
          newLink: `/leaguemanager/venues/new`
        }}
      />

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
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

                  {allVenuesData && allVenuesData.map(({ _id, name, street, zipCode, city, active }) => {
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
                          <Link href={`/leaguemanager/venues/edit/${_id}`}>
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