import Header from '../components/Header';
import Footer from '../components/Footer';
import { Fragment, useState } from 'react'
import { Dialog, Menu, Transition, Disclosure } from '@headlessui/react';
import Link from 'next/link';
import { useRouter } from "next/router";
import HeroIcon from './HeroIcon';
import { XMarkIcon, Bars3BottomLeftIcon, ChevronRightIcon, PencilIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { NavData } from '../types/NavData';
import { Description } from '@headlessui/react/dist/components/description/description';

export default function LayoutAdm({
  children,
  navData,
  sectionTitle,
  description,
  newLink,
  editLink,
  breadcrumbs
}: {
  children: React.ReactNode
  navData: NavData[],
  sectionTitle: string,
  description?: string,
  newLink?: string,
  editLink?: string,
  breadcrumbs?: { order: number, name: string; url: string }[]
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-100 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-75 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <span>Spielbetrieb</span>
                  </div>

                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">

                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navData?.map((item) => (
                            <li key={item.name}>
                              <Link href={item.href} className="border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group hover:no-underline flex items-center px-3 py-2 text-sm font-medium border-l-4">
                                <HeroIcon
                                  icon={item.icon}
                                  className='text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>

                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <main className="flex-grow w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex ">
          <div className="hidden lg:z-40 lg:flex lg:w-72 lg:flex-col">
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <span>Spielbetrieb</span>
              </div>

              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">

                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navData?.map((item) => (
                        <li key={item.name}>
                          <Link href={item.href} className="border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group hover:no-underline flex items-center px-3 py-2 text-sm font-medium border-l-4">
                            <HeroIcon
                              icon={item.icon}
                              className='text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>

                </ul>
              </nav>
            </div>
          </div>

          <div className="w-full">
            <div className="z-35 sticky top-16 flex py-4 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white shadow-sm sm:gap-x-6 px-4 sm:px-6 lg:px-8">
              <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                <span className="sr-only">Open sidebar</span>
                <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

              <div className="w-full">

                {/* Section Header */}
                <div className="lg:flex lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <nav className="flex" aria-label="Breadcrumb">
                      <ol role="list" className="flex items-center space-x-4">
                        {breadcrumbs?.map((crumb, index) => (
                          <li key={index}>
                            <div className="flex">
                              {index !== 0 && <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />}
                              <Link href={crumb.url} className={`${index === 0 ? '' : 'ml-4'} text-sm font-medium text-gray-500 hover:text-gray-700`}>
                                {crumb.name}
                              </Link>
                            </div>

                          </li>
                        ))}
                      </ol>
                    </nav>
                    <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                      {sectionTitle}
                    </h2>
                    <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6 font-light text-gray-400">
                      {description}
                    </div>
                  </div>
                  <div className="mt-5 flex lg:ml-4 lg:mt-0">
                    {editLink && (
                      <span className="hidden sm:block">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          onClick={() => router.push(editLink)}
                        >
                          <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Bearbeiten
                        </button>
                      </span>
                    )}
                    {newLink && (
                      <span className="hidden sm:block">
                        <button
                          type="button"
                          className="ml-auto flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          onClick={() => router.push(newLink)}
                        >
                          <PlusCircleIcon className="-ml-1.5 h-5 w-5" aria-hidden="true" />
                          Neu
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <section className="py-2">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="mt-8 flex flex-col">
                  <div className="">
                    {children}
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/*
      <div className="min-h-screen relative">
        <div className="mx-auto max-w-screen-xl pb-6 lg:pb-16">
          <div className="overflow-hidden">
            <div className="divide-y divide-gray-200 md:grid md:grid-cols-12 md:divide-y-0 md:divide-x">
              {sidebar}
              {sectionHeader}
              <main className="px-4 md:px-8 py-6 md:col-span-9 flex-auto clear-left">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
      */}
      <Footer />
    </div >
  )
};
