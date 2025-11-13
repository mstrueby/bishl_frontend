// File: pages/documents/[category].tsx

import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import apiClient from '../../lib/apiClient';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { DocumentValues as DocumentValues } from '../../types/DocumentValues';
import { classNames } from '../../tools/utils';
import { CldImage } from 'next-cloudinary';
import { getFuzzyDate } from '../../tools/dateUtils';
import { formatFileSize } from '../../tools/utils';
import DataList from '../../components/ui/DataList';

interface DocumentPageProps {
  category: string;
  docs: DocumentValues[];
}

const DocumentPage: NextPage<DocumentPageProps> = ({ category, docs }) => {
  const router = useRouter();
  const categories = [
    { name: 'Allgemein', href: 'allgemein', current: category === 'allgemein' },
    { name: 'Spielbetrieb', href: 'spielbetrieb', current: category === 'spielbetrieb' },
    { name: 'Hobbyliga', href: 'hobbyliga', current: category === 'hobbyliga' },
  ];

  const docValues = docs
  .slice()
  .map((doc: DocumentValues) => ({
    ...doc
  }))
  .sort((a, b) => {
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });

  const dataListItems = docValues.map((doc: DocumentValues) => {
    const fileExtension = doc.fileName.split('.').pop();
    let imageSrc = null;
    switch (fileExtension) {
      case 'pdf':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112186/icons/pdf.png';
        break;
      case 'docx':
      case 'doc':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112198/icons/docx.png';
        break;
      case 'xlsx':
      case 'xls':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/xlsx.png';
        break;
      case 'pptx':
      case 'ppt':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/ppt.png';
        break;
      case 'txt':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/txt.png';
        break;
      case 'csv':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/csv.png';
        break;
    }

    return {
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      url: doc.url,
      description: [doc.fileName, formatFileSize(doc.fileSizeByte), getFuzzyDate(doc.updateDate)],
      image: imageSrc ? {
        src: imageSrc,
        width: 32,
        height: 32,
        gravity: '',
        className: 'object-contain',
        radius: 0,
      } : undefined,
    }
  });
  

  return (
    <Layout>
      <Head><title>Dokumente</title></Head>
      <div className="border-b border-gray-200 pb-5 sm:pb-0 mb-8">
        <h1 className="my-4 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Dokumente</h1>
        <div className="mt-3 sm:mt-4">
          <div className="sm:hidden">
            <label htmlFor="current-tab" className="sr-only">
              Select a tab
            </label>
            <Listbox
              value={categories.find((cat) => cat.current) || categories[0]}
              onChange={(selectedCategory) => {
                router.push(`/documents/${selectedCategory.href}`);
              }}
            >
              {({ open }) => (
                <>
                  <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                      <span className="block truncate">
                        {categories.find((cat) => cat.current)?.name || categories[0].name}
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
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {categories.map((cat) => (
                          <Listbox.Option
                            key={cat.name}
                            value={cat}
                            className={({ active }) =>
                              classNames(
                                active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                'relative cursor-default select-none py-2 pl-3 pr-9'
                              )
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                  {cat.name}
                                </span>
                                
                                {selected ? (
                                  <span
                                    className={classNames(
                                      active ? 'text-white' : 'text-indigo-600',
                                      'absolute inset-y-0 right-0 flex items-center pr-3'
                                    )}
                                  >
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
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
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8">
              {categories.map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/documents/${cat.href}`}
                  aria-current={cat.current ? 'page' : undefined}
                  className={classNames(
                    cat.current
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium',
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <DataList
        items={dataListItems}
      />

      <div className="legal mt-8 text-sm text-gray-500 italic">
        Icons made by <a href="https://www.flaticon.com/authors/awicon" rel="noreferrer nofollow" target="_blank" title="Awicon">Awicon</a> from <a href="https://www.flaticon.com/" title="Flaticon">https://www.flaticon.com</a>
      </div>
      
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const category = context.params ? context.params.category : undefined;
  const res = await apiClient.get(`/documents/categories/${category}`, {
    params: { 
      published: true,
      page: 1,
      page_size: 100
    },
  });

  return {
    props: {
      category,
      docs: res.data || [],
    },
  };
};

export default DocumentPage;