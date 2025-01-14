import { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import ProfileForm from '../../../components/admin/ProfileForm';
import Layout from '../../../components/Layout';
import SectionHeader from "../../../components/admin/SectionHeader";
import { UserValues } from '../../../types/UserValues';
import ErrorMessage from '../../../components/ui/ErrorMessage';

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'] + '/users/me';

interface EditProps {
  jwt: string,
  profile: UserValues
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const jwt = getCookie('jwt', context) as string | undefined;
  if (!jwt) {
    return { notFound: true };
  }

  let profile = null;
  try {
    // First check if user has required role
    const response = await axios.get(`${BASE_URL}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    profile = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching profile:', error.message);
    }
  }
  return profile ? { props: { jwt, profile } } : { notFound: true };
};

const Profile: NextPage<EditProps> = ({ jwt, profile }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Handler for form submission
  const onSubmit = async (values: UserValues) => {
    setError(null);
    setLoading(true);
    console.log('submitted values', values)
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append(key, file));
        } else if (key === 'club') {
          formData.append(key, JSON.stringify(value));
        } else {
          // Handle imageUrl specifically to ensure it's only appended if not null
          if (key === 'imageUrl' && value !== null) {
            formData.append(key, value);
          } else if (key !== 'imageUrl') {
            formData.append(key, value);
          }
        }
      });

      // Debug FormData by logging key-value pairs to the console
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.patch(BASE_URL, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (response.status === 200) {
        router.push({
          pathname: '/',
          query: { message: `Dein Profile wurde erfolgreich aktualisiert.` }
        }, `/`);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 304) {
          // Handle when a 304 status is caught by error
          router.push({
            pathname: '/',
            query: { message: `Es wurden keine Änderungen an deinem Profil vorgenommen.` }
          }, `/`);
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
    router.push('/');
  }

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const intialValues: UserValues = {
    _id: profile._id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    club: {
      clubId: profile.club.clubId,
      clubName: profile.club.clubName,
    },
    roles: profile.roles,
  };

  const sectionTitle = 'Mein Profil';

  return (
    <Layout>
      <SectionHeader title={sectionTitle} />

      {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}

      <ProfileForm
        initialValues={intialValues}
        onSubmit={onSubmit}
        enableReinitialize={true}
        handleCancel={handleCancel}
        loading={loading}
      />

    </Layout>
  )
};

export default Profile;

