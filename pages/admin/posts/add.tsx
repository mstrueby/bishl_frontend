import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import PostForm from '../../../components/admin/PostForm'
import { PostValuesForm } from '../../../types/PostValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + "/posts/"

interface AddProps {
  jwt: string;
  user: {
    firstName: string;
    lastName: string;
  }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context);
  let user = {
    firstName: "",
    lastName: "",
    roles: []
  };
  
  try {
    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    user = userResponse.data;
    
    if (!user.roles?.includes('AUTHOR') && !user.roles?.includes('ADMIN')) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    user = response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  return {
    props: {
      jwt,
      user
    }
  }
}

export default function Add({ jwt, user }: AddProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: PostValuesForm = {
    _id: '',
    title: '',
    alias: '',
    content: '',
    published: false,
    featured: false,
    author: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };

  const onSubmit = async (values: PostValuesForm) => {
    setError(null);
    setLoading(true);
    console.log(values);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'author') {
          // Convert author object to JSON string before appending
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string); // Ensure value is of string type
        }
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
  )
};
