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

    // Remove 'roles' from the values object
    console.log('submitted values', values)
    const { roles, _id, firstName, lastName, club, password, confirmPassword, ...filteredValues } = values;
    
    // Check if password fields are filled
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setError('Die Passwörter stimmen nicht überein.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
        setLoading(false);
        return;
      }
      // Only include password if it's being changed
      filteredValues.password = password;
    }
    
    console.log('filtered values', filteredValues)
    try {
      const response = await axios.patch(BASE_URL, filteredValues, {
        headers: {
          'Content-Type': 'application/json',
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
    password: '',
    confirmPassword: '',
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