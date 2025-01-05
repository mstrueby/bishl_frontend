
import { useRouter } from 'next/router';
import { useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import RefMatchFilter from './RefMatchFilter';
import BulkStatusDialog from './BulkStatusDialog';

interface FilterChangeParams {
  tournament: string;
  showUnassignedOnly: boolean;
  date_from?: string;
  date_to?: string;
}

export default function SectionHeader({ title, filter, newLink, onFilterChange, onBulkUpdate }: {
  title: string,
  filter?: string,
  newLink?: string,
  onFilterChange?: (filter: FilterChangeParams) => void,
  onBulkUpdate?: (status: string) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
      <h2 className="my-4 text-2xl font-bold text-gray-900 truncate sm:text-3xl sm:tracking-tight">
        {title}
      </h2>
      <div className="flex lg:ml-4">
        {filter && (
          <>
            <RefMatchFilter onFilterChange={onFilterChange!} />
            {onBulkUpdate && (
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="ml-2 flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
  );
}
