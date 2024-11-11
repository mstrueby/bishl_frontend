// page to edit a tournament
// /leaguemanager/tournaments/[tAlias]/edit
import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import PostForm from '../../../../components/admin/PostForm';
import Layout from '../../../../components/Layout';
import SectionHeader from "../../../../components/admin/SectionHeader";
import { PostValuesForm } from '../../../../types/PostValues';
import ErrorMessage from '../../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/posts/';

interface EditProps {
  jwt: string,
  post: PostValuesForm
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  const { alias } = context.params as { alias: string };

  // Fetch the existing Post data
  let post = null;
  try {
    const response = await axios.get(BASE_URL + alias, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    post = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching post:', error.message);
    }
  }
  return post ? { props: { jwt, post } } : { notFound: true };
};

const Edit: NextPage<EditProps> = ({ jwt, post }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: PostValuesForm) => {
    setError(null);
    setLoading(true);
    console.log('Submitted values:', values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (key === 'imageUrl' && value !== null) {
          // Only append imageUrl if it is not null
          formData.append(key, value);
        } else if (key !== 'imageUrl') {
          formData.append(key, value);
        }
      });
      const response = await axios.patch(BASE_URL + post._id, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200 || response.status === 304) {
        router.push({
          pathname: '/admin/posts',
          query: { message: `Der Beitrag <strong>${values.title}</strong> wurde erfolgreich aktualisiert.` }
        }, `/admin/posts`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/posts');
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

  const intialValues: PostValuesForm = {
    _id: post._id,
    title: post.title,
    alias: post.alias,
    imageUrl: post.imageUrl,
    content: post.content,
    published: post.published,
    featured: post.featured,
  };

  const sectionTitle = 'Beitrag bearbeiten';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <PostForm
        initialValues={intialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />

    </Layout>
  )
};

export default Edit;

