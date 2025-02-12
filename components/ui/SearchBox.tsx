import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

interface SearchOption {
  id: string;
  label: string;
}

interface SearchBoxProps {
  placeholder?: string;
  options: SearchOption[];
  onSearch: (value: string) => void;
  onSelect: (option: SearchOption) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ placeholder, options, onSearch, onSelect }) => {
  const [selected, setSelected] = useState<SearchOption | null>(null);
  const [query, setQuery] = useState('');

  const handleSelect = (option: SearchOption) => {
    setSelected(option);
    onSelect(option);
  };

  const filteredOptions = query === '' ? [] : options;

  return (
    <Combobox value={selected} onChange={handleSelect}>
      <div className="relative">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Combobox.Input
            className="w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder={placeholder || "Suche..."}
            onChange={(event) => {
              setQuery(event.target.value);
              onSearch(event.target.value);
            }}
            displayValue={(option: SearchOption) => option?.label || ''}
          />
        </div>
        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.map((option) => (
            <Combobox.Option
              key={option.id}
              value={option}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-3 pr-9 ${
                  active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                }`
              }
            >
              {option.label}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export default SearchBox;