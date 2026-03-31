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
}

const MonthNav: React.FC<MonthNavProps> = ({ year, month, onPrev, onNext }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <button
        onClick={onPrev}
        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Vorheriger Monat"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <span className="text-xl font-semibold text-gray-800">
        {GERMAN_MONTHS[month - 1]} {year}
      </span>
      <button
        onClick={onNext}
        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Nächster Monat"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default MonthNav;
