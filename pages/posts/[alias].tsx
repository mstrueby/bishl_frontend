import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Standings from '../../components/ui/Standings';
import { BarsArrowUpIcon, CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'; // Import German locale
import ClipLoader from 'react-spinners/ClipLoader';
import { Match } from '../../types/MatchValues';
import MatchCard from '../../components/ui/MatchCard';
import Matchday from '../leaguemanager/tournaments/[tAlias]/[sAlias]/[rAlias]/[mdAlias]';
import { MatchdayValues } from '../../types/TournamentValues';
import { PostValues } from '../../types/PostValues';
import { getFuzzyDate } from '../../tools/dateUtils';

import { CldImage } from 'next-cloudinary';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Post({
  post
}: {
  post: PostValues
}) {
  const createDate = new Date(new Date(post.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString();

  return (
    <Layout>
      <Head>
        <title>{post.title}</title>
      </Head>
      <div className="bg-white px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
          <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-y-1 overflow-hidden text-sm/6 text-gray-500 my-6">
            <time dateTime={createDate} className="mr-8">
              {getFuzzyDate(createDate)}
            </time>
            <div className="-ml-4 flex items-center gap-x-4">
              <svg viewBox="0 0 2 2" className="-ml-0.5 h-0.5 w-0.5 flex-none fill-black/50">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <div className="flex items-center gap-x-2.5">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {`${post.author.firstName[0]}${post.author.lastName[0]}`}
                </div>
                <div className="text-sm/6">
                  <p className="font-extralight text-gray-900">
                    <a href="#">
                      <span className="absolute inset-0" />
                      {post.author.firstName}
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

          {post.imageUrl && (
            <CldImage src={post.imageUrl} alt="post image" width={768} height={432} aspectRatio="16:9"
              crop="fill"
              gravity="auto"
              className="aspect-[16/9] w-full rounded-xl object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
            />
          )}

          {post.content && (
            <div className="mt-10 max-w-2xl">
              <div className="post" dangerouslySetInnerHTML= {{ __html: post.content }} ></div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`);
  const allPostsData = await res.json();
  const paths = allPostsData.map((post: PostValues) => ({
    params: { alias: post.alias },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const alias = params?.alias;

  if (!alias) {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${alias}`);
    const postData = await res.json();

    if (!postData) {
      return { notFound: true };
    }

    return {
      props: {
        post: postData
      },
      revalidate: 10 // or your preferred revalidation time
    };
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }
};