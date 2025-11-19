
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import DocumentForm from '../../../../components/admin/DocumentForm';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import { DocumentValuesForm } from '../../../../types/DocumentValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import LoadingState from '../../../../components/ui/LoadingState';
import useAuth from '../../../../hooks/useAuth';
import usePermissions from '../../../../hooks/usePermissions';
import { UserRole } from '../../../../lib/auth';
import apiClient from '../../../../lib/apiClient';

const Edit: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [doc, setDoc] = useState<DocumentValuesForm | null>(null);
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
    
    if (!hasAnyRole([UserRole.ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching
  useEffect(() => {
    if (authLoading || !user || !alias) return;
    
    const fetchDocument = async () => {
      try {
        const response = await apiClient.get(`/documents/${alias}`);
        setDoc(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching document:', error);
        router.push('/admin/documents');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchDocument();
  }, [authLoading, user, alias, router]);

  const onSubmit = async (values: DocumentValuesForm) => {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, value as string);
        }
      });

      // Log filtered FormData fields
      console.log('FormData entries:', Array.from(formData.entries()));

      const response = await apiClient.patch(`/documents/${doc?._id}`, formData);
      if (response.status === 200) {
        router.push({
          pathname: '/admin/documents',
          query: { message: `Das Dokument <strong>${values.title}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/documents`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      if (error.response?.status === 304) {
        router.push({
          pathname: '/admin/documents',
          query: { message: `Keine Änderungen am Dokument <strong>${values.title}</strong> vorgenommen.` }
        }, `/admin/documents`);
      } else {
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
  if (authLoading || dataLoading) {
    return <Layout><LoadingState /></Layout>;
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  if (!doc) {
    return <Layout><LoadingState /></Layout>;
  }

  const initialValues: DocumentValuesForm = {
    _id: doc._id,
    title: doc.title,
    alias: doc.alias,
    category: doc.category,
    published: doc.published,
    url: doc.url,
    fileName: doc.fileName,
  };

  const sectionTitle = 'Dokument aktualisieren';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />
      {error && (
        <ErrorMessage
          error={error}
          onClose={handleCloseMessage}
        />
      )}
      <DocumentForm
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
