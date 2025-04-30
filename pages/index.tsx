import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { PostValues } from '../types/PostValues';
import Layout from "../components/Layout";
import { getFuzzyDate } from '../tools/dateUtils';
import { ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { CldImage } from 'next-cloudinary';
import SuccessMessage from '../components/ui/SuccessMessage';
import { classNames } from '../tools/utils';

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


const Home: NextPage<PostsProps> = ({ jwt, posts = [] }) => {
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
        {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}
        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/** Matze */}
            {/**
            <div className="text-center max-w-4xl mx-auto mb-24 sm:mb-36 p-4 sm:p-8 border-4 border-black">
              <div className="mb-6">
                <CldImage
                  src="https://res.cloudinary.com/dajtykxvp/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1744883924/Matze.jpg"
                  alt="Matze"
                  width={175}
                  height={175} // Maintain aspect ratio
                  gravity="face"
                  crop="fill"
                  grayscale
                  className="rounded-full shadow-md"
                />
              </div>
              <div>
                <h1 className="text-lg/6 font-semibold text-gray-900 tracking-tight uppercase font-serif">
                  Lieber Matze
                </h1>
                <div className="mt-5 text-sm/6 text-gray-600">
                  <p className="mt-2">
                    Mit dir verlieren wir eine prägende Persönlichkeit der ersten Stunde.
                    Deine besondere Herzenswärme war für jeden spürbar, der dich umgab.
                    Danke für deinen Einsatz als Spieler, Trainer, Schiedsrichter,
                    Schiedsrichter-Obmann und Vereinsvorsitzenden.
                  </p>
                  <p className="mt-2">
                    Du fehlst, und wir wünschen deiner Familie, Freunden,
                    und dem Verein Red Devils Berlin viel Kraft und alles erdenklich Gute.
                  </p>
                  <p className="mt-2">
                    Wir trauern um einen großen Pionier des Sports.
                  </p>
                  <p className="mt-2 mt-6 sm:mt-6 text-left">
                    Traueranzeige für Matthias Pipke,<br />
                    Red Devils Berlin, im Namen der
                  </p>
                  <div className="mt-3 sm:mt-3 text-left flex flex-col">
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">BISHL</div>
                      <div className="flex-grow">Berliner Inline Skaterhockey Liga</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">ISHD</div>
                      <div className="flex-grow">Inline-Skaterhockey Deutschland</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">IRVB</div>
                      <div className="flex-grow">Inline- und Rollsport-Verband Berlin</div>
                    </div>
                    <div className="flex flex-row">
                      <div className="flex-shrink-0 w-16">DRIV</div>
                      <div className="flex-grow">Deutscher Rollsport- und Inline-Verband</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            */}
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
                      priority
                    />
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