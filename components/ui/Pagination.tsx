import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

type Props = {
  items: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

const pageSize: number = parseInt(process.env['RESULTS_PER_PAGE'] || '10')

export default function Pagination({ items, currentPage, onPageChange }: Props) {
  const pageCount = Math.ceil(items / pageSize)
  console.log("items, pageSize, PageCount: ", items, pageSize, pageCount)

  if (pageCount === 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const pageInactive = "inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
  const pageActive = "inline-flex items-center border-t-2 border-indigo-500 px-4 pt-4 text-sm font-medium text-indigo-600";

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        <a
          href="#"
          className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
        >
          <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
          Zurück
        </a>
      </div>
      <div className="hidden md:-mt-px md:flex">
        {pages.map((page) => (
          <Link href={page === 1 ? `/leaguemanager/venues` : `/leaguemanager/venues?page=${page}`} key={page}>
            <a
              className={
                currentPage === page
                  ? pageActive
                  : pageInactive
              } >
              {page}
            </a>
          </Link>

        ))}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        <a
          href="#"
          className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
        >
          Vor
          <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />
        </a>
      </div>

    </nav>
  )
}

export const paginate = (items: any, pageNumber: number) => {
  const startIndex = (pageNumber - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};