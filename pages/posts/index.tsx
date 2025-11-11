import Head from "next/head";
import { GetServerSideProps, NextPage } from 'next';
import axios from 'axios';
import Link from 'next/link';
import { getCookie } from 'cookies-next';
import { PostValues } from '../../types/PostValues';
import Layout from "../..//components/Layout";
import { getFuzzyDate } from '../../tools/dateUtils';
import { CldImage } from 'next-cloudinary';
import apiClient from '../../lib/apiClient';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface PostsProps {
  jwt: string,
  posts: PostValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let posts = null;
  try {
    const res = await apiClient.get('/posts/', {
      params: {
        published: true,
        page: 1,
        page_size: 100
      }
    });
    posts = res.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching posts:', error);
    }
  }
  return posts ? { props: { jwt, posts } } : { props: { jwt, posts: [] } };
};

const Posts: NextPage<PostsProps> = ({ jwt, posts }) => {

  const postItems = posts
    .slice()
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
    .map((post: PostValues) => ({
      _id: post._id,
      title: post.title,
      alias: post.alias,
      author_firstname: post.author.firstName,
      author_lastname: post.author.lastName,
      content: post.content,
      imageUrl: post.imageUrl,
      createUser: post.createUser.firstName + ' ' + post.createUser.lastName,
      createDate: new Date(new Date(post.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: post.updateUser ? (post.updateUser.firstName + ' ' + post.updateUser.lastName) : '-',
      updateDate: new Date(new Date(post.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      published: post.published,
      featured: post.featured,
    }));

  return (
    <>
      <Head>
        <title>Aktuelles</title>
      </Head>
      <Layout>
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-4xl">
              <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Aktuelles</h2>
              {/*<p className="mt-2 text-lg/8 text-gray-600">Learn how to grow your business with our expert advice.</p>*/}
              {postItems.length === 0 ? (
                <p className="mt-20 text-lg/8 text-gray-500">Keine Beiträge vorhanden.</p>
              ) : (
                <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
                  {postItems.map((post) => (
                    <article key={post._id} className="relative isolate flex flex-col gap-8 sm:flex-row">
                      <div className="relative w-full sm:w-1/2 lg:w-1/3">
                        <CldImage
                          alt="Post Thumbnail"
                          src={post.imageUrl ? post.imageUrl : 'https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png'}
                          className="w-full rounded-2xl object-cover aspect-[16/9]"
                          layout="responsive"
                          width={1024}
                          height={576}
                          crop="fill"
                          gravity="auto"
                          radius={18}
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-y-1 overflow-hidden text-sm/6 text-gray-500">
                          <time dateTime={post.createDate} className="mr-8">
                            {getFuzzyDate(post.createDate)}
                          </time>
                          <div className="-ml-4 flex items-center gap-x-4">
                            <svg viewBox="0 0 2 2" className="-ml-0.5 h-0.5 w-0.5 flex-none fill-black/50">
                              <circle r={1} cx={1} cy={1} />
                            </svg>
                            <div className="flex items-center gap-x-2.5">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                                {`${post.author_firstname[0]}${post.author_lastname[0]}`}
                              </div>
                              <div className="text-sm/6">
                                <p className="font-extralight text-gray-900">
                                  <a href="#">
                                    <span className="absolute inset-0" />
                                    {post.author_firstname}
                                  </a>
                                </p>
                                {/*<p className="text-gray-600">{post.author.role}</p>*/}
                              </div>
                            </div>
                            {/*
                          <a
                            href={post.category.href}
                            className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                          >
                            {post.category.title}
                          </a>
                          */}
                          </div>
                        </div>
                        <div className="group relative max-w-xl">
                          <h3 className="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600">
                            <Link href={`/posts/${post.alias}`} passHref>
                              <a href="#">
                                <span className="absolute inset-0" />
                                {post.title}
                              </a>
                            </Link>
                          </h3>
                          <div className="mt-5 line-clamp-3 text-sm/6 text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </Layout>
    </>
  );
}

export default Posts;