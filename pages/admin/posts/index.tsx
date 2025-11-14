import { useState, useEffect } from "react";
import React from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { PostValues } from '../../../types/PostValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../tools/dateUtils';
import DataList from '../../../components/admin/ui/DataList';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';

const Posts: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [posts, setPosts] = useState<PostValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    if (!authLoading && !hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) {
      router.push('/');
    }
  }, [user, authLoading, hasAnyRole, router]);

  // Fetch posts on mount
  useEffect(() => {
    if (!user || !hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) return;

    const fetchPosts = async () => {
      try {
        const res = await apiClient.get('/posts', {
          params: { page: 1 }
        });
        setPosts(res.data || []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching posts:', error);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchPosts();
  }, [user, hasAnyRole]);

  const fetchPosts = async () => {
    try {
      const res = await apiClient.get('/posts', {
        params: { page: 1 }
      });
      setPosts(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching posts:', error);
      }
    }
  };


  const editPost = (alias: string) => {
    router.push(`/admin/posts/${alias}/edit`);
  };

  const togglePublished = async (postId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('published', (!currentStatus).toString());
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await apiClient.patch(`/posts/${postId}`, formData);
      if (response.status === 200) {
        console.log(`Post ${postId} published successfully.`);
        await fetchPosts();
      } else if (response.status === 304) {
        console.log('No changes were made to the post.');
      } else {
        console.error('Failed to publish the post.');
      }
    } catch (error) {
      console.error('Error publishing the post:', error);
    }
  };

  const toggleFeatured = async (postId: string, currentStatus: boolean, imageUrl: string | null) => {
    try {
      const formData = new FormData();
      formData.append('featured', (!currentStatus).toString());
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }
      const response = await apiClient.patch(`/posts/${postId}`, formData);
      if (response.status === 200) {
        console.log(`Post ${postId} featured successfully.`);
        await fetchPosts();
      } else if (response.status === 304) {
        console.log('No changes were made to the post.');
      } else {
        console.error('Failed to feature the post.');
      }
    } catch (error) {
      console.error('Error featuring the post:', error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!postId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true');

      const response = await apiClient.patch(`/posts/${postId}`, formData);

      if (response.status === 200) {
        console.log(`Post ${postId} successfully deleted.`);
        await fetchPosts();
      } else if (response.status === 304) {
        console.log('No changes were made to the post.');
      } else {
        console.error('Failed to delete post.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
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

  const post_values = posts
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

  // Show loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Beiträge" />
        <LoadingState />
      </Layout>
    );
  }

  // Redirect if not authorized (render nothing while redirecting)
  if (!hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) {
    return null;
  }

  const sectionTitle = 'Beiträge';
  const newLink = '/admin/posts/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
    Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  }

  const dataListItems = post_values.map((post) => {
    return {
      _id: post._id,
      title: post.title,
      alias: post.alias,
      description: ["erstellt von " + post.author, getFuzzyDate(post.updateDate)],
      image: post.imageUrl ? {
        src: post.imageUrl,
        width: 128,
        height: 72,
        gravity: 'auto',
        className: "rounded-lg object-cover",
        radius: 18,
      } : undefined,
      published: post.published,
      featured: post.featured,
      menu: [
        { edit: { onClick: () => editPost(post.alias) } },
        { feature: { onClick: () => { toggleFeatured(post._id, post.featured, post.imageUrl || null) } } },
        { publish: { onClick: () => { togglePublished(post._id, post.published, post.imageUrl || null) } } },
        { delete: { onClick: () => {} } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader
        title={sectionTitle}
        newLink={newLink}
      />

      {successMessage && <SuccessMessage message={successMessage} onClose={handleCloseSuccessMessage} />}

      <DataList
        items={dataListItems}
        statuses={statuses}
        onDeleteConfirm={deletePost}
        deleteModalTitle="Beitrag löschen"
        deleteModalDescription="Möchtest du den Beitrag <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showThumbnails
        showStatusIndicator
      />

    </Layout>
  );
}

export default Posts;