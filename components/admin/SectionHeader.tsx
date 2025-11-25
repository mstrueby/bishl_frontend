import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import RefMatchFilter from './RefMatchFilter';
import BulkStatusDialog from './BulkStatusDialog';
import { TournamentValues } from '../../types/TournamentValues';

interface FilterChangeParams {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

export default function SectionHeader({ title, filter, newLink, onFilterChange, onBulkUpdate, description, descriptionLogoUrl, backLink, searchBox }: {
  title: string,
  filter?: string,
  newLink?: string,
  onFilterChange?: (filter: FilterChangeParams) => void,
  onBulkUpdate?: (status: string) => void,
  description?: string,
  descriptionLogoUrl?: string,
  backLink?: string
  searchBox?: React.ReactNode
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  return (
    <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h2>
        {description && (
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              {descriptionLogoUrl && (
                <Image
                  src={descriptionLogoUrl}
                  alt="Team logo"
                  width={24}
                  height={24}
                  className="ml-1.5 mr-3 h-6 w-6 object-contain"
                />
              )}
              <span>{description}</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex sm:ml-4 sm:mt-0 gap-x-2 items-center">
        {searchBox && <div className="w-64">{searchBox}</div>}
        {filter && (
          <>
            <RefMatchFilter onFilterChange={onFilterChange!} />
            {onBulkUpdate && (
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <ArrowPathIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Status
              </button>
            )}
            <BulkStatusDialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              isLoading={isUpdating}
              onConfirm={async (status) => {
                setIsUpdating(true);
                const success = await onBulkUpdate?.(status);
                setIsUpdating(false);
                if (success) {
                  setIsDialogOpen(false);
                }
              }}
            />
          </>
        )}
        {backLink && (
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => router.push(backLink)}
          >
            <ArrowUturnLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            Zurück
          </button>
        )}
        {newLink && (
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => router.push(newLink)}
          >
            <PlusCircleIcon className="mr-0.5 -ml-1.5 h-5 w-5" aria-hidden="true" />
            Neu
          </button>
        )}
      </div>
    </div>
  );
}