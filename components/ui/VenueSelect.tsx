import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { VenueValues } from '../../types/VenueValues';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { CldImage } from 'next-cloudinary';
import { classNames } from '../../tools/utils';

interface VenueSelectProps {
  selectedVenueId?: string | null;
  venues: VenueValues[];
  onVenueChange: (venueId: string) => void;
  label?: string;
}

const VenueSelect: React.FC<VenueSelectProps> = ({
  selectedVenueId,
  venues = [], // Provide default empty array
  onVenueChange,
  label = "Spielstätte"
}) => {
  const selectedVenue = venues.find(venue => venue._id === selectedVenueId);

  return (
    <Listbox value={selectedVenueId} onChange={onVenueChange}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
              {label}
            </Listbox.Label>
          )}
          <div className="relative mt-2 mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {selectedVenueId && venues.find(v => v._id === selectedVenueId) ? (
                  <>
                    <span className="block truncate">{venues.find(v => v._id === selectedVenueId)?.name}</span>
                  </>
                ) : (
                  <span className="block truncate text-gray-400">(auswählen)</span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {venues.map((venue) => (
                  <Listbox.Option
                    key={venue._id}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={venue._id}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                            {venue.name}
                          </span>
                        </div>
                        {selected && (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default VenueSelect;