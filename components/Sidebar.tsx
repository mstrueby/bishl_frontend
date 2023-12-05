// Sidebar.tsx

import { Disclosure } from '@headlessui/react';
import Link from 'next/link';
import HeroIcon from './HeroIcon';
import { XMarkIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({
  NavData
}: {
  NavData: {
    name: string;
    icon: string;
    href: string;
    current: boolean;
  }[];
}) {
  return (
    <Disclosure as="nav" className="py-6 md:col-span-3" aria-label="Sidebar">
      {({ open }) => (
        <>
          <div className="hidden md:ml-6 md:block space-y-1 bg-white">
            {NavData.map(({ name, href, icon }) => (

              <Link href={href} key={name}>
                <a className="border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium border-l-4">
                  <HeroIcon
                    icon={icon}
                    className='text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                    aria-hidden="true"
                  />
                  {name}
                </a>
              </Link>

            ))}
          </div>

          {/* Disclosure Button */}
          <Disclosure.Button className="px-4 py-2 text-sm font-medium text-left rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-opacity-75 md:hidden">
            <span className="absolute -inset-0.5" />
            <span className="sr-only">Open main menu</span>
            {open ? (
              <XMarkIcon className="block w-6 h-6" aria-hidden="true" />
            ) : (
              <Bars3BottomLeftIcon className="block w-6 h-6" aria-hidden="true" />
            )}
            <span className="sr-only">{open ? 'Close sidebar' : 'Open sidebar'}</span>
          </Disclosure.Button>

          {/* Disclosure Panel */}
          <Disclosure.Panel className={`absolute z-10 left-auto transform ${open ? "translate-x-0" : "-translate-x-full"} bg-white w-64 h-full shadow-md p-4 transition-transform duration-300 ease-in-out md:hidden`}>
            <div className="space-y-1">
              {NavData.map(({ name, href, icon, current }) => (
                <Link href={href} key={name}>
                  <a
                    className={classNames(
                      current ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "group flex items-center px-3 py-2 text-sm font-medium border-l-4 border-transparent"
                    )}
                  >
                    <HeroIcon
                      icon={icon}
                      className="w-6 h-6 mr-3 text-gray-400 flex-shrink-0 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    {name}
                  </a>
                </Link>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
