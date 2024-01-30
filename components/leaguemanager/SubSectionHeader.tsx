import { useRouter } from "next/router";
import { PlusSmallIcon } from '@heroicons/react/24/solid';

export default function SubSectionHeader({
  title,
  newLink
}: {
  title: string,
  newLink?: string
}) {
  const router = useRouter();

  return (

    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
      <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
      <div className="mt-3 sm:ml-4 sm:mt-0">
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={() => {
            if (newLink) {
              router.push(newLink);
            }
          }}
        >
          <PlusSmallIcon className="-ml-1.5 h-5 w-5" aria-hidden="true" />
          Neu
        </button>
      </div>
    </div>

  )
}

