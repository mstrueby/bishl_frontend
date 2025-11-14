import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import apiClient from "../../../lib/apiClient";
import ProfileForm from "../../../components/admin/ProfileForm";
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import { UserValues } from "../../../types/UserValues";
import ErrorMessage from "../../../components/ui/ErrorMessage";

interface EditProps {
  profile: UserValues;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Profile page relies on client-side authentication via apiClient
  // We can't check auth server-side since tokens are in localStorage
  // The page will handle auth checks client-side via AuthContext
  return { props: {} };
};

const Profile: NextPage<EditProps> = () => {
  const [profile, setProfile] = useState<UserValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const router = useRouter();

  // Fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/users/me");
        setProfile(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError("Fehler beim Laden des Profils.");
          console.error("Error fetching profile:", error);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handler for form submission
  const onSubmit = async (values: UserValues) => {
    setError(null);
    setLoading(true);

    // Remove 'roles' from the values object
    console.log("submitted values", values);
    const { roles, _id, club, ...filteredValues } = values;

    console.log("filtered values", filteredValues);
    try {
      const formData = new FormData();
      Object.entries(filteredValues).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      // Debug FormData by logging key-value pairs to the console
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await apiClient.patch(
        `/users/${profile!._id}`,
        formData,
      );
      console.log("response", response.data);
      if (response.status === 200) {
        router.push(
          {
            pathname: "/",
            query: {
              message:"Dein Profil wurde erfolgreich aktualisiert."
            },
          },
          `/`,
        );
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError("Ein Fehler ist aufgetreten.");
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  useEffect(() => {
    if (error) {
      window.scrollTo(0, 0);
    }
  }, [error]);

  const handleCloseMessage = () => {
    setError(null);
  };

  const sectionTitle = "Mein Profil";

  if (initialLoading) {
    return (
      <Layout>
        <SectionHeader title={sectionTitle} />
        <div className="flex justify-center items-center min-h-screen">
          <div>Laden...</div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <SectionHeader title={sectionTitle} />
        {error && <ErrorMessage error={error} onClose={handleCloseMessage} />}
      </Layout>
    );
  }

  const intialValues: UserValues = {
    _id: profile._id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    club: {
      clubId: profile.club ? profile.club.clubId : "",
      clubName: profile.club ? profile.club.clubName : "",
      logoUrl: profile.club ? profile.club.logoUrl : "",
    },
    roles: profile.roles,
  };

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
  );
};

export default Profile;
