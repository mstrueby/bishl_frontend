// File: pages/documents/[category].tsx

import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../../components/Layout';
import { DocumentsValues } from '../../types/DocumentsValues';
import { classNames } from '../../tools/utils';
import { CldImage } from 'next-cloudinary';
import { getFuzzyDate } from '../../tools/dateUtils';
import { formatFileSize } from '../../tools/utils';

interface DocumentPageProps {
  category: string;
  documents: DocumentsValues[];
}

const getIconUrl = (fileExtension: string): string => {
  switch (fileExtension.toLowerCase()) {
    case 'pdf':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112186/icons/pdf.png';
    case 'docx':
    case 'doc':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112198/icons/docx.png';
    case 'xlsx':
    case 'xls':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/xlsx.png';
    case 'pptx':
    case 'ppt':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/ppt.png';
    case 'txt':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/txt.png';
    case 'csv':
      return 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/csv.png';
    default:
      return '';
  }
};

const DocumentPage: NextPage<DocumentPageProps> = ({ category, documents }) => {
  const categories = [
    { name: 'Allgemein', href: 'allgemein', current: category === 'allgemein' },
    { name: 'Spielbetrieb', href: 'spielbetrieb', current: category === 'spielbetrieb' },
    { name: 'Hobbyliga', href: 'hobbyliga', current: category === 'hobbyliga' },
  ];



  return (
    <Layout>
      <Head><title>Dokumente</title></Head>
      <div className="border-b border-gray-200 pb-5 sm:pb-0 mb-8">
        <h1 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Dokumente</h1>
        <div className="mt-3 sm:mt-4">
          <div className="sm:hidden">
            <label htmlFor="current-tab" className="sr-only">
              Select a tab
            </label>
            <select
              id="current-tab"
              name="current-tab"
              defaultValue={categories.find((cat) => cat.current)?.name || categories[0].name}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8">
              {categories.map((cat) => (
                <Link key={cat.name} href={`/documents/${cat.href}`}>
                  <a
                    aria-current={cat.current ? 'page' : undefined}
                    className={classNames(
                      cat.current
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                      'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium',
                    )}
                  >
                    {cat.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>





      {/* Sub-navigation */}
      {/*
      <nav className="mb-4">
        <ul className="flex space-x-4">
          {categories.map((cat) => (
            <li key={cat}>
              <Link href={`/documents/${cat}`}>
                <a
                  className={`py-2 px-4 ${cat === category ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      */}
      {/* Document List */}




      <ul role="list" className="divide-y divide-gray-100">
        {documents.map((doc) => (
          <li key={doc._id} className="relative flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <CldImage
                src={getIconUrl(doc.fileName.split('.').pop() || '')}
                alt={`${doc.fileType} icon`}
                width={32}
                height={32}
                className="object-contain"
                radius={0}
              />
              <div className="min-w-0 flex-auto">
                <p className="text-sm/6 font-semibold text-gray-900">
                  <a href={doc.url} target="_blank" rel="noreferrer nofollow">
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {doc.title}
                  </a>
                </p>
                <div className="flex items-center gap-x-2 text-xs/5 text-gray-500">
                  <span className="whitespace-nowrap truncate">{doc.fileName}
                  </span>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle r={1} cx={1} cy={1} />
                  </svg>
                  <span className="whitespace-nowrap truncate">{formatFileSize(doc.fileSizeByte)}
                  </span>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle r={1} cx={1} cy={1} />
                  </svg>
                  <span className="whitespace-nowrap truncate">{getFuzzyDate(doc.updateDate)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const category = context.params ? context.params.category : undefined;
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/documents/categories/${category}`);

  return {
    props: {
      category,
      documents: res.data,
    },
  };
};

export default DocumentPage;