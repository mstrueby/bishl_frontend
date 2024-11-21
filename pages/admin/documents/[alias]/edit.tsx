import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import DocumentForm from '../../../../components/admin/DocumentForm';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import { DocumentsValuesForm } from '../../../../types/DocumentsValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/documents/';

interface EditProps {
  jwt: string;
  doc: DocumentsValuesForm;
}

export const getServerSideProps: GetServerSideProps<EditProps> = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  const { alias } = context.params as { alias: string };

  if (!jwt) {
    // If JWT is undefined, return notFound or redirect, as appropriate
    return { notFound: true };
  }

  let doc = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    doc = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching document:', error.message);
    }
  }

  return doc ? { props: { jwt, doc } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, doc }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit = async (values: DocumentsValuesForm) => {
    setError(null)
    setLoading(true)
    console.log('submitted values', values)
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, value as string);
        }
      });

      const response = await axios.patch(BASE_URL + doc._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
      if (response.status === 200) {
        router.push({
          pathname: '/admin/documents',
          query: { message: `Das Dokument <strong>${values.title}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/documents`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          // Handle when a 304 status is caught by error
          router.push({
            pathname: '/admin/documents',
            query: { message: `Keine Änderungen am Dokument <strong>${values.title}</strong> vorgenommen.` }
          }, `/admin/documents`);
        } else {
          setError('Ein Fehler ist aufgetreten.');
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/documents');
  }

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  }; 

  const initialValues: DocumentsValuesForm = {
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
        enableReinitialize= {true}
        handleCancel= {handleCancel}
        loading={loading}
      />
    </Layout>
  )
};

export default Edit;