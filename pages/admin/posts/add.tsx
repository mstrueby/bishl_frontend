import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import PostForm from '../../../components/admin/PostForm'
import { PostValuesAdd } from '../../../types/PostValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/posts/"

interface AddProps {
  jwt: string
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const jwt = getCookie('jwt', { req, res });
  return { props: { jwt } };
}

export default function Add({ jwt }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: PostValuesAdd = {
    title: '',
    alias: '',
    content: '',
    published: false,
    featured: false,
  };

  const onSubmit = async (values: PostValuesAdd) => {
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await axios.post(BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.status === 201) {
        router.push({
          pathname: '/admin/posts',
          query: { message: `Der Beitrag <strong>${values.title}</strong> wurde erfolgreich erstellt.` }
        }, '/admin/posts');
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
    router.push('/admin/posts');
  };

  useEffect(() => {
    if (error) {
      // Scroll to the top of the page to show the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const formProps = {
    initialValues,
    onSubmit,
    enableReinitialize: true,
    handleCancel,
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
      />
    </Layout>
  )
};
