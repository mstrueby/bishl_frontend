
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PostForm from '../../../../components/admin/PostForm';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import { PostValuesForm } from '../../../../types/PostValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../components/ui/LoadingState';
import useAuth from '../../../../hooks/useAuth';
import usePermissions from '../../../../hooks/usePermissions';
import { UserRole } from '../../../../lib/auth';
import apiClient from '../../../../lib/apiClient';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [post, setPost] = useState<PostValuesForm | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { alias } = router.query as { alias: string };

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user || !alias) return;
    
    const fetchPost = async () => {
      try {
        const response = await apiClient.get(`/posts/${alias}`);
        setPost(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching post:', error);
        router.push('/admin/posts');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchPost();
  }, [authLoading, user, alias, router]);

  const onSubmit = async (values: PostValuesForm) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Skip _id field
        if (key === '_id') return;

        // Handle image/imageUrl specially
        if (key === 'image' || key === 'imageUrl') {
          if (value instanceof File) {
            // New file upload
            formData.append('image', value);
          } else if (value === null) {
            // Image was removed - signal backend to delete
            formData.append('imageUrl', '');
          }
          // If value is a string (existing URL), don't append anything - backend keeps existing
          return;
        }

        // Handle File objects (from ImageUpload)
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        // Handle FileList (legacy support)
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
          return;
        }
        // Handle author object
        if (key === 'author') {
          formData.append(key, JSON.stringify(value));
          return;
        }
        // Handle boolean values - always include them
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
          return;
        }
        // For other values, skip if empty
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Log filtered FormData fields
      console.log('FormData entries:', Array.from(formData.entries()));

      const response = await apiClient.patch(`/posts/${post?._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: '/admin/posts',
          query: { message: `Der Beitrag <strong>${values.title}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/posts`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      if (error.response?.status === 304) {
        router.push({
          pathname: '/admin/posts',
          query: { message: `Keine Änderungen am Beitrag <strong>${values.title}</strong> vorgenommen.` }
        }, `/admin/posts`);
      } else {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/posts');
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // Auth guard
  if (!hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) return null;

  if (!post) {
    return <Layout><LoadingState /></Layout>;
  }

  const initialValues: PostValuesForm = {
    _id: post._id,
    title: post.title,
    alias: post.alias,
    imageUrl: post.imageUrl,
    content: post.content,
    published: post.published,
    featured: post.featured,
    author: {
      firstName: post.author.firstName,
      lastName: post.author.lastName,
    },
  };

  const sectionTitle = 'Beitrag bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <PostForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />
    </Layout>
  );
};

export default Edit;
