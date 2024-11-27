import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { PostValues } from '../types/PostValues';
import Layout from "../components/Layout";
import { getFuzzyDate } from '../tools/dateUtils';
import { ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { CldImage } from 'next-cloudinary';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/posts/';

interface PostsProps {
  jwt: string | null,
  posts: PostValues[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) || null;
  let posts = null;
  try {
    const res = await axios.get(BASE_URL, {
      params: {
        published: true,
        limit: 3
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    posts = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching posts:", error);
    }
  }
  return posts ? { props: { jwt, posts } } : { props: { jwt } };
}


const Home: NextPage<PostsProps> = ({ jwt, posts }) => {


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
      createDate: new Date(post.createDate).toISOString(),
      updateUser: post.updateUser ? (post.updateUser.firstName + ' ' + post.updateUser.lastName) : '-',
      updateDate: new Date(post.updateDate).toISOString(),
      published: post.published,
      featured: post.featured,
    }));

  return (
    <>
      <Head>
        <title>BISHL</title>
      </Head>
      <Layout>
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/*<div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl mb-16">
                Aktuelles
              </h2>
              <p className="mt-2 text-lg/8 text-gray-600">Learn how to grow your business with our expert advice.</p>
            </div>*/}
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {postItems.map((post) => (
                <article key={post._id} className="flex flex-col items-start justify-between">
                  <div className="relative w-full">
                    {post.imageUrl ? (
                      <CldImage
                        alt="Post Thumbnail"
                        src={post.imageUrl}
                        className="w-full rounded-2xl bg-gray-100 object-cover aspect-[16/9]"
                        layout="responsive"
                        width={1024}
                        height={576}
                        crop="fill"
                        gravity="auto"
                        radius={18}
                        priority
                      />
                    ) : (
                      <div className="inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10 aspect-[16/9] w-full bg-gray-100 object-cover"></div>
                    )}
                  </div>
                  <div className="max-w-xl">
                    <div className="mt-8 flex items-center gap-x-4 text-xs">
                      <time dateTime={post.createDate} className="text-gray-500">
                        {getFuzzyDate(post.createDate)}
                      </time>
                      {/*<a
                        href={post.category.href}
                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                      >
                        {post.category.title}
                      </a>
                      */}
                    </div>
                    <div className="group relative">
                      <h3 className="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600">
                        <Link href={`/posts/${post.alias}`} passHref>
                          <a>
                            <span className="absolute inset-0" />
                            {post.title}
                          </a>
                        </Link>
                      </h3>
                      <div className="mt-5 line-clamp-3 text-sm/6 text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                    </div>
                    <div className="relative mt-8 flex items-center gap-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
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
                  </div>
                </article>
              ))}
            </div>
            {postItems.length > 0 && (
              <div className="flex justify-center sm:justify-end w-full mt-20 sm:mt-12">
                <Link href="/posts" passHref>
                  <a className="inline-flex items-center justify-center w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 flex items-center gap-2">
                    Weitere Artikel
                    <ArrowLongRightIcon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

export default Home