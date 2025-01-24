
import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

type Props = {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  basePath: string;
};

export default function Pagination({ totalItems, currentPage, onPageChange, itemsPerPage, basePath }: Props) {
  const pageCount = Math.ceil(totalItems / itemsPerPage)

  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const pageInactive = "inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
  const pageActive = "inline-flex items-center border-t-2 border-indigo-500 px-4 pt-4 text-sm font-medium text-indigo-600";

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        {currentPage > 1 && (
          <Link href={`${basePath}?page=${currentPage - 1}`}>
            <a className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
              Zurück
            </a>
          </Link>
        )}
      </div>
      <div className="hidden md:-mt-px md:flex">
        {pages.map((page) => (
          <Link href={`${basePath}${page === 1 ? '' : `?page=${page}`}`} key={page}>
            <a
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
              className={currentPage === page ? pageActive : pageInactive}
            >
              {page}
            </a>
          </Link>
        ))}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        {currentPage < pageCount && (
          <Link href={`${basePath}?page=${currentPage + 1}`}>
            <a className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Vor
              <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            </a>
          </Link>
        )}
      </div>
    </nav>
  )
}
