import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const GERMAN_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const MonthNav: React.FC<MonthNavProps> = ({ year, month, onPrev, onNext, onToday }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <span className="text-xl font-semibold text-gray-800">
        {GERMAN_MONTHS[month - 1]} {year}
      </span>

      <div className="flex items-center">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative h-9 md:block"
        >
          Heute
        </button>
        <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
          aria-label="Nächster Monat"
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default MonthNav;
