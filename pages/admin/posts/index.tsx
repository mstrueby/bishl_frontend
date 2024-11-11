import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { PostValues } from '../../../types/PostValues';
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/posts/';

interface PostsProps {
  jwt: string,
  posts: PostValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let posts = null;
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    posts = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching posts:', error);
    }
  }
  return posts ? { props: { jwt, posts } } : { props: { jwt } };
};

const Posts: NextPage<PostsProps> = ({ jwt, posts: inittialPosts }) => {
  const [posts, setPosts] = useState<PostValues[]>(inittialPosts);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      const res = await axios.get(BASE_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const togglePublished = async (postId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('published', (!currentStatus).toString()); // Toggle the status
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await axios.patch(`${BASE_URL}${postId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        // Handle successful response
        console.log(`Post ${postId} published successfully.`);
        await fetchPosts();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the post.');
      } else {
        // Handle error response
        console.error('Failed to publish the post.');
      }
    } catch (error) {
      console.error('Error publishing the post:', error);
    }
  }

  const toggleFeatured = async (postId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('featured', (!currentStatus).toString()); // Toggle the status
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }
      const response = await axios.patch(`${BASE_URL}${postId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      if (response.status === 200) {
        // Handle successful response
        console.log(`Post ${postId} featured successfully.`);
        await fetchPosts();
      } else if (response.status === 304) {
        // Handle not modified response
        console.log('No changes were made to the post.');
      } else {
        // Handle error response
        console.error('Failed to feature the post.');
      }
    } catch (error) {
      console.error('Error featuring the post:', error);
    }
  }

  const deletePost = async (postId: string) => {
    if (!postId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true'); // Mark the post as deleted

      const response = await axios.patch(`${BASE_URL}${postId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 200) {
        console.log(`Post ${postId} successfully deleted.`);
        await fetchPosts(); // Refresh posts
      } else if (response.status === 304) {
        console.log('No changes were made to the post.');
      } else {
        console.error('Failed to delete post.');
      }
    } catch (error) {
      console.error('Error mdeleting post:', error);
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

  // Handler to close the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const dataListItems = posts
    .slice()
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
    .map((post: PostValues) => ({
      _id: post._id,
      title: post.title,
      alias: post.alias,
      author: post.author.firstName + ' ' + post.author.lastName,
      imageUrl: post.imageUrl,
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
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <ul role="list" className="divide-y divide-gray-100">
        {dataListItems.map((post, index) => (
          <li key={post._id} className="flex items-center justify-between gap-x-6 py-5">

            {post.imageUrl ? (
              <CldImage
                src={post.imageUrl}
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
                  erstellt von {post.author}
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                  <circle r={1} cx={1} cy={1} />
                </svg>
                <p className="truncate">{getFuzzyDate(post.createDate)}</p>
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
                      href={`/admin/posts/${post.alias}/edit`}
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
                      onClick={() => post._id && toggleFeatured(post._id, post.featured, post.imageUrl)}
                    >
                      {post.featured ? (
                        <StarIcon className={`h-4 w-4 mr-2 text-gray-500`} aria-hidden="true" />
                      ) : (
                        <StarIcon className={`h-4 w-4 mr-2 text-indigo-500`} aria-hidden="true" />
                      )}
                      {post.featured ? 'Loslösen' : 'Anheften'}<span className="sr-only">, {post.title}</span>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                      onClick={() => post._id && togglePublished(post._id, post.published, post.imageUrl)}
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
                      onClick={() => {
                        if (post._id) {
                          setPostIdToDelete(post._id);
                          setPostTitle(post.title);
                          setIsModalOpen(true);
                        }
                      }}
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

      {isModalOpen &&
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => {
            if (postIdToDelete !== null) {
              deletePost(postIdToDelete);
            }
            setPostIdToDelete(null);
            setPostTitle(null);
            setIsModalOpen(false);
          }}
          title={"Beitrag löschen"}
          description={`Möchtest du wirklich den Beitrag ${postTitle} löschen?`}
          descriptionStrong={postTitle}
          descriptionSubText={`Dies kann nicht rückgängig gemacht werden.`}
        />
      }

    </Layout>
  );
}

export default Posts;