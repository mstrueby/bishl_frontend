import { Fragment, useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import useAuth from '../hooks/useAuth'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const men = [
  { name: 'Regionalliga Ost', tiny_name: 'RLO', href: '#' },
  { name: 'Landesliga', tiny_name: 'LL', href: '#' },
]
const youth = [
  { name: 'Juniorenliga', tiny_name: 'U19', href: '#' },
  { name: 'Jugendliga', tiny_name: 'U16', href: '#' },
  { name: 'Schülerliga', tiny_name: 'U13', href: '#' },
  { name: 'Bambini', tiny_name: 'U10', href: '#' },
  { name: 'Mini', tiny_name: 'U8', href: '#' },
]

const item = "rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
const itemActive = "inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"

const MyLink = forwardRef((props, ref) => {
  let { href, children, ...rest } = props
  return (
    <Link href={href}>
      <a ref={ref} {...rest}>
        {children}
      </a>
    </Link>
  )
})

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
  }, []);

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              
              {/* Navigation */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                    alt="Your Company"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                    <Link href="/">
                      <a className={item}>Home</a>
                    </Link>
                    <Link href="/venues">
                      <a className={item}>Spielstätten</a>
                    </Link>
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className={item}>Herren</Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {men.map((item, index) => (
                            <Menu.Item>
                              {({ active }) => (
                                <MyLink 
                                  key={index}
                                  href="/venues"
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
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
                        <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {youth.map((item, index) => (
                            <Menu.Item>
                              {({ active }) => (
                                <MyLink 
                                  key={index}
                                  href="/venues"
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
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
                          {({ active }) => (
                            <a
                              href="#"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Settings
                            </a>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="/logout"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Abmelden
                            </a>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  ) : (
                  
                  /* Login Menu Link */
                  <Link href="/login">
                    <a className={classNames("border-2 border-gray-100", item)}>Anmelden</a>
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
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
              <Disclosure.Button
                as="a"
                href="/"
                className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
              >
                Home
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="/venues"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Spielstätten
              </Disclosure.Button>
              
              <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-300">
                <span>Herren</span>
              </div>
              <div className="block left-0 ml-6 px-1 origin-top-right rounded-md bg-gray-700 py-1 text-gray-300">
                {men.map((item, index) => (
                  <Disclosure.Button
                    as="a"
                    key={index}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-800 hover:text-white"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>

              <div className="block rounded-md px-3 py-2 text-base font-medium text-gray-300">
                <span>Nachwuchs</span>
              </div>
              <div className="block left-0 ml-6 px-1 origin-top-right rounded-md bg-gray-700 py-1 text-gray-300">
                {youth.map((item, index) => (
                  <Disclosure.Button
                    as="a"
                    key={index}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-800 hover:text-white"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              
            </div>
            
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
};

export default Header