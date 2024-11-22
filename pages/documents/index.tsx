// File: pages/documents/index.tsx

import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  // Redirect to the 'allgemein' category as the default
  return {
    redirect: {
      destination: '/documents/allgemein',
      permanent: false, // Set to false for a temporary redirect. Set to true if you want it to be permanent.
    },
  };
};

export default function DocumentsIndex() {
  return null; // This component doesn't need to render anything because it's used solely for redirection.
}