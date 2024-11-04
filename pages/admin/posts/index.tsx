import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { PostValues } from '../../../types/PostValues';
import {
  PlusCircleIcon, EllipsisVerticalIcon, PencilSquareIcon, StarIcon,
  DocumentArrowUpIcon, DocumentArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import LayoutAdm from "../../../components/LayoutAdm";
import Layout from "../../../components/Layout";
import NavDataPosts from "../../../components/admin/navDataPosts";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../tools/dateUtils';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Posts({
  postValues
}: {
  postValues: PostValues[]
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

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

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const dataListItems = postValues
    .slice()
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
    .map((post: PostValues) => ({
      _id: post._id,
      title: post.title,
      alias: post.alias,
      createUser: post.createUser.firstName + ' ' + post.createUser.lastName,
      createDate: new Date(new Date(post.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: post.updateUser ? (post.updateUser.firstName + ' ' + post.updateUser.lastName) : '-',
      updateDate: new Date(new Date(post.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      published: post.published,
      featured: post.featured,
    }));

  const sectionTitle = 'Beiträge';
  const newLink = '/admin/posts/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Draft: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  return (
    <Layout>
      {/* Section Header */}
      <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
        <h2 className="my-4 text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {sectionTitle}
        </h2>
        <div className="flex lg:ml-4">
          {newLink && (
            <button
              type="button"
              className="ml-auto flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => router.push(newLink)}
            >
              <PlusCircleIcon className="-ml-1.5 h-5 w-5" aria-hidden="true" />
              Neu
            </button>
          )}
        </div>
      </div>

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <ul role="list" className="divide-y divide-gray-100">
        {dataListItems.map((post, index) => (
          <li key={post._id} className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-x-3">
                <div className={classNames(statuses[post.published ? 'Published' : 'Draft'], 'flex-none rounded-full p-1')}>
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
                <p className="text-sm/6 font-semibold text-gray-900 truncate">{post.title}</p>
                {post.featured && (
                  <p
                    className='inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10'
                  >
                    Angeheftet
                  </p>
                )}
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
                <p className="whitespace-nowrap">
                  erstellt von {post.createUser}
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="truncate">{getFuzzyDate(post.createDate)}</p>
              </div>
            </div>

            {/* Context Menu */}
            <div className="flex flex-none items-center gap-x-4">
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
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
                      Bearbeiten<span className="sr-only">, {post.title}</span>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      <StarIcon className={`h-4 w-4 mr-2 ${post.featured ? 'text-gray-500' : 'text-indigo-500'}`} aria-hidden="true" />
                      {post.featured ? 'Loslösen' : 'Anheften'}<span className="sr-only">, {post.title}</span>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      {post.published ? (
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
                      ) : (
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2 text-green-500" aria-hidden="true" />
                      )}
                      {post.published ? 'Entwurf' : 'Veröffentlichen'}<span className="sr-only">, {post.title}</span>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      <TrashIcon className="h-4 w-4 mr-2 text-red-500" aria-hidden="true" />
                      Löschen<span className="sr-only">, {post.title}</span>
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </li>
        ))}
      </ul>

    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const postValues = await res.json();

  return {
    props: {
      postValues,
      revalidate: 60,
    },
  };
}