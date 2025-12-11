
import { useState, useEffect } from 'react'
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import PostForm from '../../../components/admin/PostForm'
import { PostValuesForm } from '../../../types/PostValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import LoadingState from '../../../components/ui/LoadingState';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Auth check
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

  const onSubmit = async (values: PostValuesForm) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === '_id') return;
        if (key === 'author') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });

      // Log filtered FormData fields
      console.log('submitted values');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await apiClient.post('/posts', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/posts',
          query: { message: `Der Beitrag <strong>${values.title}</strong> wurde erfolgreich erstellt.` }
        }, '/admin/posts');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (error) {
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

  // Show loading state during auth
  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.AUTHOR, UserRole.ADMIN])) {
    return null;
  }

  const initialValues: PostValuesForm = {
    _id: '',
    title: '',
    alias: '',
    content: '',
    published: false,
    featured: false,
    author: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  };

  const sectionTitle = 'Beitrag erstellen';

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
}

export default Add;
