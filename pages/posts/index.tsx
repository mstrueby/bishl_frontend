import { useState, useEffect } from "react";
import Head from "next/head";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { PostValues } from '../../types/PostValues';
import {
  EllipsisVerticalIcon, PencilSquareIcon, StarIcon,
  DocumentArrowUpIcon, DocumentArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Layout from "../..//components/Layout";
import { getFuzzyDate } from '../../tools/dateUtils';
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

  const sectionTitle = 'Beiträge';
  const newLink = '/admin/posts/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Draft: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

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
              <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
                {postItems.map((post) => (
                  <article key={post._id} className="relative isolate flex flex-col gap-8 lg:flex-row">
                    <div className="relative w-1/3">
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
                        />
                      ) : (
                        <div className="inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10 aspect-[16/9] w-full bg-gray-100 object-cover"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-x-4 text-xs">
                        <time dateTime={post.createDate} className="text-gray-500">
                          {getFuzzyDate(post.createDate)}
                        </time>
                        {/*
                        <a
                          href={post.category.href}
                          className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                        >
                          {post.category.title}
                        </a>
                        */}
                      </div>
                      <div className="group relative max-w-xl">
                        <h3 className="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600">
                          <a href="#">
                            <span className="absolute inset-0" />
                            {post.title}
                          </a>
                        </h3>
                        <div className="mt-5 text-sm/6 text-gray-600" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                      </div>
                      <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                        <div className="relative flex items-center gap-x-4">
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
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

      </Layout>
    </>
  );
}

export default Posts;