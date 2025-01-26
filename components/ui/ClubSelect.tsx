import { Fragment } from 'react';
import Image from 'next/image';
import { Listbox, Transition } from '@headlessui/react';
import { ClubValues } from '../../types/ClubValues';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface ClubSelectProps {
  selectedClubId?: string | null;
  clubs: ClubValues[];
  onClubChange: (clubId: string) => void;
  label?: string;
}

const ClubSelect: React.FC<ClubSelectProps> = ({ 
  selectedClubId,
  clubs = [], // Provide default empty array
  onClubChange,
  label = "Verein"
}) => {
  const selectedClub = clubs.find(club => club._id === selectedClubId);

  return (
    <Listbox value={selectedClubId} onChange={onClubChange}>
      <div className="relative mt-2">
        {label && (
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            {label}
          </Listbox.Label>
        )}
        <div className="relative mt-2">
          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
            <span className="flex items-center">
              {selectedClub ? (
                <>
                  <Image 
                    src={selectedClub.logoUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} 
                    alt={selectedClub.name || ''} 
                    width={20} 
                    height={20} 
                    className="h-5 w-5 flex-shrink-0 rounded-full" 
                  />
                  <span className="ml-3 block truncate">{selectedClub.name}</span>
                </>
              ) : (
                <span className="ml-3 block truncate text-gray-500">Verein auswählen</span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {clubs.map((club) => (
                <Listbox.Option
                  key={club._id}
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                  value={club._id}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <Image 
                          src={club.logoUrl || 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'} 
                          alt={club.name || ''} 
                          width={20} 
                          height={20} 
                          className="h-5 w-5 flex-shrink-0 rounded-full" 
                        />
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>
                          {club.name}
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
      </div>
    </Listbox>
  );
};

export default ClubSelect;
