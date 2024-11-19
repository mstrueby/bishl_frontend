import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { DocumentsValues } from '../../../types/DocumentsValues';
import {
  EllipsisVerticalIcon, PencilSquareIcon, StarIcon,
  DocumentArrowUpIcon, DocumentArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { getFuzzyDate } from '../../../tools/dateUtils';
import { CldImage } from 'next-cloudinary';
import { setISODay } from "date-fns";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/documents/';

interface DocsProps {
  jwt: string;
  posts: DocumentsValues[];
}

export const getServerSideProps: GetServerSideProps<DocsProps> = async (context) => {
  const jwt = getCookie('jwt', { req: context.req });
  let docs = null;
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    docs = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching docs:', error);
    }
  }
  return docs ? { props: { jwt, docs } } : { props: { jwt } };
}

const Documents: NextPage<DocsProps> = ({ jwt, docs: initialDocs }) => {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentsValues[]>(initialDocs);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [docIdToDelete, setDocIdToDelete] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await axios.get(BASE_URL, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setDocs(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching docs:', error);
      }
    }
  };

  const tooglePublished = async (docId: string, currentStatus: boolean, url: string | null) => {
    try {
      const formData = new FormData();
      formData.append('published', (!currentStatus).toString());
      if (url) {
        formData.append('url', url);
      }

      const res = await axios.post(`${BASE_URL}${docId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        console.log(`Document ${docId} published status changed to ${!currentStatus}`);
        await fetchDocs();
      } else if (res.status === 304) {
        console.log('No changes made');
      } else {
        console.log(`Document ${docId} published status could not be changed`);
      }
    } catch (error) {
      console.error('Error toggling published status:', error);
    }
  }
  const deleteDoc = async (docId: string) => {
    if (!docId) return;
    try {
      const res = await axios.delete(`${BASE_URL}${docId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      if (res.status === 204) {
        console.log(`Document ${docId} deleted successfully`);
        await fetchDocs();
      } else {
        console.log(`Failed to delete document ${docId}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      // Update the URL to remove the message from the query parameters
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const dataListItems = docs
    .slice()
    .map((doc: DocumentsValues) => ({
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      category: doc.category,
      url: doc.url,
      publicId: doc.publicId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeByte: doc.fileSizeByte,
      createDate: new Date(new Date(doc.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      createUser: doc.createUser.firstName + ' ' + doc.createUser.lastName,
      updateDate: new Date(new Date(doc.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: doc.updateUser.firstName + ' ' + doc.updateUser.lastName,
      published: doc.published,
    }));

  const sectionTitle = 'Dokumente';
  const newLink = '/admin/documents/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
  }

  return (
    <Layout>
      <SectionHeader
        title= {sectionTitle}
        newLink= {newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <ul role="list" className="divide-y divide-gray-100">
        {dataListItems.map((doc, index) => (
          <li key={doc._id} className="flex items-center justify-between gap-x-6 py-5">

            {doc.url ? (
              <CldImage
                src={doc.url}
                alt="Post Thumbnail"
                className="rounded-lg object-cover"
                width={128} height={72}
                crop="fill"
                gravity="auto"
                radius={18}
              />
            ) : (
              <div className="relative w-32 flex-none rounded-lg border bg-gray-50 sm:inline-block aspect-[16/9]"></div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-3">
                <div className={classNames(statuses[doc.published ? 'Published' : 'Unpublished'], 'flex-none rounded-full p-1')}>
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
                <p className="text-sm/6 font-semibold text-gray-900 truncate">{doc.title}</p>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
                <p className="truncate">
                  {doc.fileName}
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="truncate">
                  {doc.filSizeByte}
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="truncate">geändert {getFuzzyDate(doc.updateDate)}</p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
              </div>
            </div>

            {/* Context Menu */}
            <div className="flex-none gap-x-4">
              <Menu as="div" className="relative flex-none">
                <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon aria-hidden="true" className="h-5 w-5" />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <MenuItem>
                    <Link
                      href={`/admin/documents/${doc.alias}/edit`}
                    >
                      <a className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none">
                        <PencilSquareIcon className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
                        Bearbeiten<span className="sr-only">, {post.title}</span>
                      </a>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                      onClick={() => doc._id && togglePublished(doc._id, doc.published, doc.url)}
                    >
                      {doc.published ? (
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
                      ) : (
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2 text-green-500" aria-hidden="true" />
                      )}
                      {doc.published ? 'Entwurf' : 'Veröffentlichen'}<span className="sr-only">, {doc.title}</span>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                      onClick={() => {
                        if (doc._id) {
                          setPostIdToDelete(doc._id);
                          setPostTitle(doc.title);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      <TrashIcon className="h-4 w-4 mr-2 text-red-500" aria-hidden="true" />
                      Löschen<span className="sr-only">, {doc.title}</span>
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </li>
        ))}
      </ul>
      
    </Layout>
  )
}

export default Documents;