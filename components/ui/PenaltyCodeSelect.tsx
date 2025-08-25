
import React, { Fragment, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useField } from 'formik';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../tools/utils';

interface PenaltyCode {
  key: string;
  value: string;
}

interface PenaltyCodeSelectProps {
  name: string;
  selectedPenaltyCode: PenaltyCode | null;
  onChange: (selectedPenaltyCode: PenaltyCode | null) => void;
  penaltyCodes: PenaltyCode[];
  label?: string;
  required?: boolean;
  placeholder?: string;
  tabIndex?: number;
  showErrorText?: boolean;
}

// Create a custom type that includes only the methods you want to expose.
interface PenaltyCodeSelectHandle {
  focus: () => void;
}

const PenaltyCodeSelect = forwardRef<PenaltyCodeSelectHandle, PenaltyCodeSelectProps>(({
  name,
  selectedPenaltyCode: propSelectedPenaltyCode,
  onChange,
  penaltyCodes,
  label,
  required = false,
  placeholder = "Strafe auswählen",
  tabIndex,
  showErrorText = true,
}, ref) => {
  const [field, meta, helpers] = useField(name);
  const [selectedPenaltyCode, setSelectedPenaltyCode] = useState<PenaltyCode | null>(propSelectedPenaltyCode);
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // When the 'propSelectedPenaltyCode' changes, update the local state
  useEffect(() => {
    setSelectedPenaltyCode(propSelectedPenaltyCode);
    // Update query to show selected penalty code when prop changes, or clear when null
    if (propSelectedPenaltyCode) {
      setQuery(`${propSelectedPenaltyCode.key} - ${propSelectedPenaltyCode.value}`);
    } else {
      setQuery(''); // Clear the query to show placeholder
    }
  }, [propSelectedPenaltyCode]);

  const [showAllOptions, setShowAllOptions] = useState(false);

  // Filter penalty codes based on query and showAllOptions flag
  const filteredPenaltyCodes = showAllOptions || query === ''
    ? penaltyCodes
    : penaltyCodes.filter((penaltyCode) => {
      const queryLower = query.toLowerCase().trim();

      // Key search (exact match and starts-with match)
      const keyMatch = penaltyCode.key.toLowerCase() === queryLower || 
        penaltyCode.key.toLowerCase().startsWith(queryLower);

      // Value search
      const valueMatch = penaltyCode.value.toLowerCase().includes(queryLower);

      // Combined search (e.g., "M1 Minor")
      const combinedMatch = `${penaltyCode.key} ${penaltyCode.value}`.toLowerCase().includes(queryLower) ||
        `${penaltyCode.key} - ${penaltyCode.value}`.toLowerCase().includes(queryLower);

      return keyMatch || valueMatch || combinedMatch;
    });

  const handlePenaltyCodeChange = (penaltyCode: PenaltyCode | null) => {
    setSelectedPenaltyCode(penaltyCode);
    onChange(penaltyCode);

    if (penaltyCode) {
      setQuery(`${penaltyCode.key} - ${penaltyCode.value}`);
    } else {
      setQuery('');
    }
  };

  // Add focus method to ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }), []);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setShowAllOptions(false); // Reset to filtered mode when typing

    // If query doesn't match current selection, clear selection
    if (selectedPenaltyCode) {
      const currentPenaltyCodeDisplay = `${selectedPenaltyCode.key} - ${selectedPenaltyCode.value}`;
      if (!currentPenaltyCodeDisplay.toLowerCase().includes(value.toLowerCase())) {
        setSelectedPenaltyCode(null);
        onChange(null);
      }
    }
  };

  const displayValue = (penaltyCode: PenaltyCode | null) => {
    if (!penaltyCode) return ''; // Return empty string when no penalty code selected to show placeholder
    return `${penaltyCode.key} - ${penaltyCode.value}`;
  };

  return (
    <div className="w-full">
      <Combobox value={selectedPenaltyCode} onChange={handlePenaltyCodeChange}>
        {({ open }) => (
          <>
            {label && (
              <Combobox.Label className="block mt-6 mb-2 text-sm font-medium text-gray-900">
                {label}
              </Combobox.Label>
            )}
            <div className="relative">
              <Combobox.Input
                ref={inputRef}
                tabIndex={tabIndex}
                className={`relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${meta.touched && meta.error ? 'text-red-900 border-red-300 focus:border-red-500 focus:ring-red-500 placeholder:text-red-300' : 'text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-indigo-500 focus:ring-indigo-600'}`}
                onChange={handleQueryChange}
                value={selectedPenaltyCode ? displayValue(selectedPenaltyCode) : query}
                placeholder={placeholder}
                autoComplete="off"
              />
              <Combobox.Button
                className="absolute inset-y-0 right-0 flex items-center pr-2"
                onClick={() => setShowAllOptions(true)}
              >
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Combobox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => {
                  // Only clear query if no penalty code is selected and query doesn't match any penalty code
                  if (!selectedPenaltyCode && query) {
                    const hasMatchingPenaltyCode = penaltyCodes.some(penaltyCode => {
                      const penaltyCodeDisplay = `${penaltyCode.key} - ${penaltyCode.value}`;
                      return penaltyCodeDisplay.toLowerCase().includes(query.toLowerCase()) ||
                        penaltyCode.key.toLowerCase().includes(query.toLowerCase()) ||
                        penaltyCode.value.toLowerCase().includes(query.toLowerCase());
                    });
                    if (!hasMatchingPenaltyCode) {
                      setQuery('');
                    }
                  }
                }}
              >
                <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredPenaltyCodes.length === 0 && query !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Kein Strafcode gefunden.
                    </div>
                  ) : filteredPenaltyCodes.length === 0 ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Keine Strafcodes verfügbar.
                    </div>
                  ) : (
                    filteredPenaltyCodes.map((penaltyCode) => {
                      const isSelected = selectedPenaltyCode?.key === penaltyCode.key;

                      return (
                        <Combobox.Option
                          key={penaltyCode.key}
                          className={({ active }) =>
                            classNames(
                              'relative cursor-default select-none py-2 pl-3 pr-9',
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                            )
                          }
                          value={penaltyCode}
                        >
                          {({ active }) => (
                            <>
                              <div className={classNames('flex items-center', isSelected ? 'font-semibold' : 'font-normal')}>
                                <span className="w-6 text-center mr-3 font-mono text-sm">{penaltyCode.key}</span>
                                <span className="truncate">{penaltyCode.value}</span>
                              </div>

                              {isSelected ? (
                                <span
                                  className={classNames(
                                    'absolute inset-y-0 right-0 flex items-center pr-4',
                                    active ? 'text-white' : 'text-indigo-600'
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      );
                    })
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </>
        )}
      </Combobox>
      {showErrorText && meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
});

PenaltyCodeSelect.displayName = 'PenaltyCodeSelect';

export default PenaltyCodeSelect;
