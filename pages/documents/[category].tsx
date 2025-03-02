// File: pages/documents/[category].tsx

import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../components/Layout';
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
            <select
              id="current-tab"
              name="current-tab"
              defaultValue={categories.find((cat) => cat.current)?.name || categories[0].name}
              className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              onChange={(e) => {
                const selectedName = e.target.value;
                const selectedCategory = categories.find((cat) => cat.name === selectedName);
                if (selectedCategory) {
                  router.push(`/documents/${selectedCategory.href}`);
                }
              }}
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
  const res = await axios.get(`${process.env.API_URL}/documents/categories/${category}`, {
    params: { published: true },
  });

  return {
    props: {
      category,
      docs: res.data,
    },
  };
};

export default DocumentPage;