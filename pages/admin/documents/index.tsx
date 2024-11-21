import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getCookie } from 'cookies-next';
import { DocumentsValues } from '../../../types/DocumentsValues';
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from '../../../components/ui/SuccessMessage';
import { getFuzzyDate } from '../../../tools/dateUtils';
import { formatFileSize } from '../../../tools/utils';
import DataList from '../../../components/admin/ui/DataList';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/documents/';

interface DocsProps {
  jwt: string;
  docs: DocumentsValues[];
}

export const getServerSideProps: GetServerSideProps<DocsProps> = async (context) => {
  // Ensure jwt is a string or an empty string if undefined
  const jwt = (getCookie('jwt', context) ?? '') as string;
  let docs: DocumentsValues[] = [];

  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    docs = res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching docs:', error);
    }
  }

  // Ensure we provide an empty array for docs if it's undefined
  return { props: { jwt, docs } };
}

const Documents: NextPage<DocsProps> = ({ jwt, docs: initialDocs }) => {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentsValues[]>(initialDocs);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await axios.get(BASE_URL, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setDocs(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching docs:', error);
      }
    }
  };

  const editDoc = (alias: string) => {
    router.push(`/admin/documents/${alias}/edit`);
  }

  const tooglePublished = async (docId: string, currentStatus: boolean, url: string | null) => {
    try {
      const formData = new FormData();
      formData.append('published', (!currentStatus).toString());
      if (url) {
        formData.append('url', url);
      }

      const res = await axios.patch(`${BASE_URL}${docId}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        console.log(`Document ${docId} published status changed to ${!currentStatus}`);
        await fetchDocs();
      } else if (res.status === 304) {
        console.log('No changes made');
      } else {
        console.log(`Document ${docId} published status could not be changed`);
      }
    } catch (error) {
      console.error('Error toggling published status:', error);
    }
  };

  const deleteDoc = async (alias: string) => {
    if (!alias) return;
    console.log(`${BASE_URL}${alias}`)
    try {
      const res = await axios.delete(`${BASE_URL}${alias}`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      if (res.status === 204) {
        console.log(`Document ${alias} successfully deleted.`);
        await fetchDocs();
      } else {
        console.log(`Failed to delete document ${alias}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
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

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const doc_values = docs
    .slice()
    .map((doc: DocumentsValues) => ({
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      category: doc.category,
      url: doc.url,
      publicId: doc.publicId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeByte: doc.fileSizeByte,
      createDate: new Date(new Date(doc.createDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      createUser: doc.createUser.firstName + ' ' + doc.createUser.lastName,
      updateDate: new Date(new Date(doc.updateDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString(),
      updateUser: doc.updateUser.firstName + ' ' + doc.updateUser.lastName,
      published: doc.published,
    }));

  const sectionTitle = 'Dokumente';
  const newLink = '/admin/documents/add';
  const statuses = {
    Published: 'text-green-500 bg-green-500/20',
    Unpublished: 'text-gray-500 bg-gray-800/10',
  }
  const categories = {
    allgemein: 'text-indigo-700 bg-indigo-50 ring-indigo-700/10 ',
    spielbetrieb: 'text-red-700 bg-red-50 ring-red-600/10 ',
    hobbyliga: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20 ',
  }

  const dataListItems = doc_values.map((doc) => {
    // Determine the image source based on the file extension
    const fileExtension = doc.fileName.split('.').pop();
    let imageSrc = null;
    switch (fileExtension) {
      case 'pdf':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112186/icons/pdf.png';
        break;
      case 'docx':
      case 'doc':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112198/icons/docx.png';
        break;
      case 'xlsx':
      case 'xls':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/xlsx.png';
        break;
      case 'pptx':
      case 'ppt':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/ppt.png';
        break;
      case 'txt':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/txt.png';
        break;
      case 'csv':
        imageSrc = 'https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/csv.png';
        break;
    }

    return {
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      description: [doc.fileName, formatFileSize(doc.fileSizeByte), getFuzzyDate(doc.updateDate)],
      category: doc.category,
      published: doc.published,
      image: imageSrc ? {
        src: imageSrc,
        width: 32,
        height: 32,
        gravity: 'auto',
        className: 'object-cover',
        radius: 0,
      } : undefined,
      menu: [
        { edit: { onClick: () => editDoc(doc.alias) } },
        { publish: { onClick: () => tooglePublished(doc._id, doc.published, doc.url) } },
        { delete: { onClick: () => {} } },
      ]
    }
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
        categories={categories}
        onDeleteConfirm={deleteDoc}
        deleteModalTitle="Dokument löschen"
        deleteModalDescription="Möchtest du das Dokument <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
      />

    </Layout>
  )
}

export default Documents;