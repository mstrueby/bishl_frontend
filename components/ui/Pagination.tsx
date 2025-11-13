import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

type Props = {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  basePath: string;
};


export default function Pagination({ totalItems, currentPage, onPageChange, basePath }: Props) {
  const itemsPerPage = 25; // Fixed value to ensure consistency between server and client
  const pageCount = Math.ceil(totalItems / itemsPerPage);

  if (pageCount <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < pageCount) {
        range.push(i);
      }
    }
    range.push(pageCount);

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getVisiblePages();

  const pageInactive = "inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
  const pageActive = "inline-flex items-center border-t-2 border-indigo-500 px-4 pt-4 text-sm font-medium text-indigo-600";

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        {currentPage > 1 && (
          <Link href={`${basePath}?page=${currentPage - 1}`} className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            Zurück
          </Link>
        )}
      </div>
      <div className="hidden md:-mt-px md:flex">
        {pages.map((page, index) => (
          typeof page === 'number' ? (
            <Link
              href={`${basePath}${page === 1 ? '' : `?page=${page}`}`}
              key={index}
              className={currentPage === page ? pageActive : pageInactive}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
            >
              {page}
            </Link>
          ) : (
            <span key={index} className="inline-flex items-center px-4 pt-4 text-sm font-medium text-gray-500">
              {page}
            </span>
          )
        ))}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        {currentPage < pageCount && (
          <Link href={`${basePath}?page=${currentPage + 1}`} className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Vor
            <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  )
}