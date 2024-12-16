import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { PlusCircleIcon, FunnelIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface Tournament {
  _id: string;
  name: string;
  alias: string;
}

export default function SectionHeader({ title, filter, newLink, onFilterChange }: {
  title: string,
  filter?: string,
  newLink?: string,
  onFilterChange?: (value: string) => void
}) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    if (filter) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments`)
        .then(response => response.json())
        .then(data => setTournaments(data))
        .catch(error => console.error('Error fetching tournaments:', error));
    }
  }, [filter]);

  return (
    <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
      <h2 className="my-4 text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {title}
      </h2>
      <div className="flex lg:ml-4">
        {filter && (
          <div className="relative inline-block text-left">
            <Menu as="div">
              <Menu.Button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                Wettbewerb
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onFilterChange?.('all')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          Alle Wettbewerbe
                        </button>
                      )}
                    </Menu.Item>
                    {tournaments.map((tournament) => (
                      <Menu.Item key={tournament._id}>
                        {({ active }) => (
                          <button
                            onClick={() => onFilterChange?.(tournament.alias)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            {tournament.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        )}
        {newLink && (
          <button
            type="button"
            className="ml-auto flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => router.push(newLink)}
          >
            <PlusCircleIcon className="-ml-1.5 h-5 w-5" aria-hidden="true" />
            Neu
          </button>
        )}
      </div>
    </div>
  )
}