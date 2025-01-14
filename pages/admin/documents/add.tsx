import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import DocumentForm from '../../../components/admin/DocumentForm'
import { DocumentValuesForm } from '../../../types/DocumentValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/documents/"

interface AddProps {
  jwt: string;
  user: {
    firstName: string;
    lastName: string;
  }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  if (!jwt) {
    return { notFound: true };
  }

  let user = {
    firstName: "",
    lastName: "",
    roles: []
  };
  try {
    const userResponse = await axios.get(`${process.env['NEXT_PUBLIC_API_URL']}/users/me`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const user = userResponse.data;
    if (!user.roles?.includes('DOC_ADMIN') && !user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  return {
    props: {
      jwt,
      user
    },
  }
};

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: DocumentValuesForm = {
    _id: '',
    title: '',
    alias: '',
    category: 'Allgemein',
    published: false,
  };

  const onSubmit = async (values: DocumentValuesForm) => {
    setError(null)
    setLoading(true)
    console.log(values)
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      const response = await axios.post(BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        }
      });
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
  )
}