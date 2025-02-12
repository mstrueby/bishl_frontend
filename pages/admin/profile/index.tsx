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

let BASE_URL = process.env['NEXT_PUBLIC_API_URL'];

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
    // Get user data
    const response = await axios.get(`${BASE_URL}/users/me`, {
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

    // Remove 'roles' from the values object
    console.log('submitted values', values)
    const { roles, _id, club, ...filteredValues } = values;
    
    console.log('filtered values', filteredValues)
    try {
      const formData = new FormData();
      Object.entries(filteredValues).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      // Debug FormData by logging key-value pairs to the console
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await axios.patch(`${BASE_URL}/users/${profile._id}`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("response", response.data)
      if (response.status === 200 || response.status === 304) {
        router.push({
          pathname: '/',
          query: {
            message:
              response.status === 304 
                ? 'Es wurden keine Änderungen vorgenommen'
                : 'Dein Profile wurde erfolgreich aktualisiert.'
          }
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
      clubId: profile.club ? profile.club.clubId : '',
      clubName: profile.club ? profile.club.clubName : '',
    },
    roles: profile.roles,
    password: '',
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