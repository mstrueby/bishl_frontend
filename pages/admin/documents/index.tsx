
import { useState, useEffect } from "react";
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { DocumentValues } from '../../../types/DocumentValues';
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

const Documents: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [documents, setDocuments] = useState<DocumentValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

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

  // Data fetching - separate function for reuse
  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get('/documents');
      setDocuments(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching documents:', error);
      }
    }
  };

  // Initial data load
  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      await fetchDocuments();
      setDataLoading(false);
    };
    loadData();
  }, [authLoading, user]);

  const editDocument = (alias: string) => {
    router.push(`/admin/documents/${alias}/edit`);
  };

  const togglePublished = async (documentId: string, currentStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append('published', (!currentStatus).toString());

      const response = await apiClient.patch(`/documents/${documentId}`, formData);
      if (response.status === 200) {
        console.log(`Document ${documentId} published successfully.`);
        await fetchDocuments();
      } else if (response.status === 304) {
        console.log('No changes were made to the document.');
      } else {
        console.error('Failed to publish the document.');
      }
    } catch (error) {
      console.error('Error publishing the document:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!documentId) return;
    try {
      const formData = new FormData();
      formData.append('deleted', 'true');

      const response = await apiClient.patch(`/documents/${documentId}`, formData);

      if (response.status === 200) {
        console.log(`Document ${documentId} successfully deleted.`);
        await fetchDocuments();
      } else if (response.status === 304) {
        console.log('No changes were made to the document.');
      } else {
        console.error('Failed to delete document.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace({
        pathname: currentPath,
        query: currentQuery,
      }, undefined, { shallow: true });
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Dokumente" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  const document_values = documents
    .slice()
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime())
    .map((doc: DocumentValues) => ({
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      category: doc.category,
      createUser: doc.createUser.firstName + ' ' + doc.createUser.lastName,
      createDate: new Date(new Date(doc.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: doc.updateUser ? (doc.updateUser.firstName + ' ' + doc.updateUser.lastName) : '-',
      updateDate: new Date(new Date(doc.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      published: doc.published,
    }));

  const sectionTitle = 'Dokumente';
  const newLink = '/admin/documents/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
  };

  const dataListItems = document_values.map((doc) => {
    return {
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      description: ["erstellt von " + doc.createUser, getFuzzyDate(doc.updateDate)],
      published: doc.published,
      menu: [
        { edit: { onClick: () => editDocument(doc.alias) } },
        { publish: { onClick: () => { togglePublished(doc._id, doc.published) } } },
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
        onDeleteConfirm={deleteDocument}
        deleteModalTitle="Dokument löschen"
        deleteModalDescription="Möchtest du das Dokument <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showStatusIndicator
      />
    </Layout>
  );
}

export default Documents;
