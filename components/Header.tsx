import { Fragment, useEffect, forwardRef, ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import useAuth from '../hooks/useAuth'
import { CldImage } from 'next-cloudinary';


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const men = [
  { name: 'Regionalliga Ost', tiny_name: 'RLO', href: '/tournaments/regionalliga-ost', bdg_col_dark: 'bg-red-400/10 text-red-400 ring-red-400/20', bdg_col_light: 'bg-red-50 text-red-700 ring-red-600/10' },
  { name: 'Landesliga', tiny_name: 'LL', href: '/tournaments/landesliga', bdg_col_dark: 'bg-gray-400/10 text-gray-400 ring-gray-400/20', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-500/10' },
]
const youth = [
  { name: 'Juniorenliga', tiny_name: 'U19', href: '/tournaments/juniorenliga', bdg_col_dark: 'bg-green-500/10 text-green-400 ring-green-500/20', bdg_col_light: 'bg-green-50 text-green-700 ring-green-600/20' },
  { name: 'Jugendliga', tiny_name: 'U16', href: '/tournaments/jugendliga', bdg_col_dark: 'bg-blue-400/10 text-blue-400 ring-blue-400/30', bdg_col_light: 'bg-blue-50 text-blue-700 ring-blue-700/10' },
  { name: 'Schülerliga', tiny_name: 'U13', href: '/tournaments/schuelerliga', bdg_col_dark: 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30', bdg_col_light: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' },
  { name: 'Bambini', tiny_name: 'U10', href: '/tournaments/bambini', bdg_col_dark: 'bg-purple-400/10 text-purple-400 ring-purple-400/30', bdg_col_light: 'bg-purple-50 text-purple-700 ring-purple-700/10' },
  { name: 'Mini', tiny_name: 'U8', href: '/tournaments/mini', bdg_col_dark: 'bg-pink-400/10 text-pink-400 ring-pink-400/20', bdg_col_light: 'bg-pink-50 text-pink-700 ring-pink-700/10' },
]

const item = "rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
const itemActive = "inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"

const MyLink = forwardRef<HTMLAnchorElement, { href: string; children: ReactNode; className?: string }>(
  ({ href, children, ...rest }, ref) => (
    <Link href={href}>
      <a ref={ref as any} {...rest}>
        {children}
      </a>
    </Link>
  )
);

const Header = () => {
  const { user, setUser, authError, setAuthError, loading, setLoading } = useAuth();
  useEffect(() => {
    setLoading(true);
    (async () => {
      const userData = await fetch('/api/user');
      try {
        const user = await userData.json();
        setUser(user);
      } catch (error) {
        setUser(null);
        setAuthError(error);
      }
    })();
    setLoading(false);
  }, [setLoading, setUser, setAuthError]);

  return (
    <Disclosure as="nav" className="bg-gray-800 sticky top-0 z-50 shadow-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              {/* Navigation */}
              <div className="flex items-center">
                
              <div className="flex-shrink-0 flex items-center justify-center">
                <Link href="/">
                  <div className="hover:cursor-pointer flex justify-center items-center">
                  <Image
                    src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.svg"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="block h-8 w-auto flex flex-row items-center justify-center"
                  />
                  </div>
                </Link>
              </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className={item}>Herren</Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-300"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-300"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {men.map((item, index) => (
                            <Menu.Item key={index}>
                              {({ active }) => (
                                <MyLink
                                  href={item.href}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm font-medium text-gray-600 hover:no-underline hover:text-gray-900'
                                  )}
                                >
                                  <span
                                    className={classNames("inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-12", item.bdg_col_light)}
                                  >
                                    {item.tiny_name}
                                  </span>
                                  {item.name}
                                </MyLink>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className={item}>Nachwuchs</Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {youth.map((item, index) => (
                            <Menu.Item key={index}>
                              {({ active }) => (
                                <MyLink
                                  href={item.href}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm font-medium text-gray-600 hover:no-underline hover:text-gray-900'
                                  )}
                                >
                                  <span
                                    className={classNames("inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-12", item.bdg_col_light)}
                                  >
                                    {item.tiny_name}
                                  </span>
                                  {item.name}
                                </MyLink>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>

              {/* Search, Notification, Profile menu */}
              <div className="flex items-center block">
                <div>
                  {/*
                  <button
                    type="button"
                    className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                  */}

                  {/* Profile dropdown */}
                  {loading ? <span>Loading...</span> : ""}
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex rounded-full text-gray-400 bg-gray-800 text-sm p-2 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <UserIcon className="block h-6 w-6" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="#"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Your Profile
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            <MyLink
                              href="/leaguemanager"
                              className='block px-4 py-2 text-sm text-gray-700'
                            >
                              Spielbetrieb
                            </MyLink>
                          </Menu.Item>
                          <Menu.Item>
                            <MyLink
                              href="/logout"
                              className='block px-4 py-2 text-sm text-gray-700'
                            >
                              Abmelden
                            </MyLink>
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (

                    /* Login Menu Link */
                    <Link href="/login">
                      <a className={classNames("border-2 border-gray-100 hover:no-underline", item)}>Anmelden</a>
                    </Link>

                  )}
                </div>


                {/* Mobile menu */}
                <div className="-mr-2 ml-3 flex sm:hidden items-center">

                  {/* Mobile menu button */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          {/* mobile navigation */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-300">
                  <span>Herren</span>
                </div>
                <div className="block left-0 mx-6 px-1 origin-top-right rounded-md bg-gray-900/50 py-1 text-gray-300">
                  {men.map((item, index) => (
                    <Disclosure.Button
                      as={MyLink}
                      key={index}
                      href={item.href}
                      className='block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-800 text-gray-300 hover:text-white hover:no-underline'
                    >
                      <span className={classNames("inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-12", item.bdg_col_dark)}>{item.tiny_name}</span>
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>

                <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-300">
                  <span>Nachwuchs</span>
                </div>
                <div className="block left-0 mx-6 px-1 origin-top-right rounded-md bg-gray-900/50 py-1 text-gray-300">
                  {youth.map((item, index) => (
                    <Disclosure.Button
                      as={MyLink}
                      key={index}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-800 text-gray-300 hover:text-white hover:no-underline"
                    >
                      <span className={classNames("inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-12", item.bdg_col_dark)}>{item.tiny_name}</span>
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>

              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
};

MyLink.displayName = 'MyLink';
Header.displayName = 'Header';

export default Header;