
import { useState, useEffect } from 'react'
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import DocumentForm from '../../../components/admin/DocumentForm'
import { DocumentValuesForm } from '../../../types/DocumentValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import LoadingState from '../../../components/ui/LoadingState';
import useAuth from '../../../hooks/useAuth';
import usePermissions from '../../../hooks/usePermissions';
import { UserRole } from '../../../lib/auth';
import apiClient from '../../../lib/apiClient';

const Add: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasAnyRole([UserRole.DOC_ADMIN, UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  const initialValues: DocumentValuesForm = {
    _id: '',
    title: '',
    alias: '',
    category: 'Allgemein',
    published: false,
  };

  const onSubmit = async (values: DocumentValuesForm) => {
    setError(null);
    setLoading(true);
    console.log(values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      const response = await apiClient.post('/documents', formData);
      if (response.status === 201) {
        router.push({
          pathname: '/admin/documents',
          query: { message: `Das Dokument <strong>${values.title}</strong> wurde erfolgreich hochgeladen.` }
        }, '/admin/documents');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError('Ein Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/documents');
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
  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.DOC_ADMIN, UserRole.ADMIN])) {
    return null;
  }

  const sectionTitle = 'Dokument hochladen';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      <DocumentForm
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
