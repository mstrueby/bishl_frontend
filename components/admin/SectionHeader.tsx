import { useRouter } from 'next/router';
import { PlusCircleIcon, FunnelIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function SectionHeader({ title, filter, newLink, onFilterChange }: {
  title: string,
  filter?: string,
  newLink?: string,
  onFilterChange?: (value: string) => void
}) {
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
      <h2 className="my-4 text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {title}
      </h2>
      <div className="flex lg:ml-4">
        {filter && <RefMatchFilter onFilterChange={onFilterChange} />}
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