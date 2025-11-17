import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import axios from "axios";
import { DocumentValues } from "../../../types/DocumentValues";
import Layout from "../../../components/Layout";
import SectionHeader from "../../../components/admin/SectionHeader";
import SuccessMessage from "../../../components/ui/SuccessMessage";
import { getFuzzyDate } from "../../../tools/dateUtils";
import { formatFileSize } from "../../../tools/utils";
import DataList from "../../../components/admin/ui/DataList";
import apiClient from "../../../lib/apiClient";
import useAuth from "../../../hooks/useAuth";
import { UserRole } from "../../../lib/auth";
import usePermissions from "../../../hooks/usePermissions";
import LoadingState from "../../../components/ui/LoadingState";

const Documents: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const [documents, setDocuments] = useState<DocumentValues[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Auth redirect check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasAnyRole([UserRole.ADMIN])) {
      router.push("/");
    }
  }, [authLoading, user, hasAnyRole, router]);

  // Data fetching - separate function for reuse
  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get("/documents");
      setDocuments(res.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching documents:", error);
      }
    }
  };

  // Initial data load
  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      await fetchDocuments();
      setDataLoading(false);
    };
    loadData();
  }, [authLoading, user]);

  const editDocument = (alias: string) => {
    router.push(`/admin/documents/${alias}/edit`);
  };

  const togglePublished = async (
    documentId: string,
    currentStatus: boolean,
    url: string | null,
  ) => {
    try {
      const formData = new FormData();
      formData.append("published", (!currentStatus).toString());
      if (url) {
        formData.append("url", url);
      }
      const response = await apiClient.patch(
        `/documents/${documentId}`,
        formData,
      );
      if (response.status === 200) {
        console.log(`Document ${documentId} published successfully.`);
        await fetchDocuments();
      } else if (response.status === 304) {
        console.log("No changes were made to the document.");
      } else {
        console.error("Failed to publish the document.");
      }
    } catch (error) {
      console.error("Error publishing the document:", error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!documentId) return;
    try {
      const response = await apiClient.delete(
        `/documents/${documentId}`
      );

      if (response.status === 204) {
        console.log(`Document ${documentId} successfully deleted.`);
        await fetchDocuments();
      } else {
        console.error("Failed to delete document.");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      setSuccessMessage(router.query.message as string);
      const currentPath = router.pathname;
      const currentQuery = { ...router.query };
      delete currentQuery.message;
      router.replace(
        {
          pathname: currentPath,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router]);

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <Layout>
        <SectionHeader title="Dokumente" />
        <LoadingState />
      </Layout>
    );
  }

  // Auth guard
  if (!hasAnyRole([UserRole.ADMIN])) return null;

  const docValues = documents.slice().map((doc: DocumentValues) => ({
    _id: doc._id,
    title: doc.title,
    alias: doc.alias,
    category: doc.category,
    url: doc.url,
    publicId: doc.publicId,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSizeByte: doc.fileSizeByte,
    createDate: new Date(
      new Date(doc.createDate).getTime() -
        new Date().getTimezoneOffset() * 60000,
    ).toISOString(),
    createUser: doc.createUser.firstName + " " + doc.createUser.lastName,
    updateDate: new Date(
      new Date(doc.updateDate).getTime() -
        new Date().getTimezoneOffset() * 60000,
    ).toISOString(),
    updateUser: doc.updateUser.firstName + " " + doc.updateUser.lastName,
    published: doc.published,
  })).sort((a, b) => a.title.localeCompare(b.title));

  const sectionTitle = "Dokumente";
  const newLink = "/admin/documents/add";
  const statuses = {
    Published: "text-green-500 bg-green-500/20",
    Unpublished: "text-gray-500 bg-gray-800/10",
  };

  const categories = {
    ALLGEMEIN: "text-indigo-700 bg-indigo-50 ring-indigo-700/10 ",
    SPIELBETRIEB: "text-red-700 bg-red-50 ring-red-600/10 ",
    HOBBYLIGA: "text-yellow-800 bg-yellow-50 ring-yellow-600/20 ",
  };

  const dataListItems = docValues.map((doc) => {
    // Determine the image source based on the file extension
    const fileExtension = doc.fileName.split(".").pop();
    let imageSrc = null;
    switch (fileExtension) {
      case "pdf":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112186/icons/pdf.png";
        break;
      case "docx":
      case "doc":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112198/icons/docx.png";
        break;
      case "xlsx":
      case "xls":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/xlsx.png";
        break;
      case "pptx":
      case "ppt":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/ppt.png";
        break;
      case "txt":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/txt.png";
        break;
      case "csv":
        imageSrc =
          "https://res.cloudinary.com/dajtykxvp/image/upload/v1732112197/icons/csv.png";
        break;
    }
    return {
      _id: doc._id,
      title: doc.title,
      alias: doc.alias,
      description: [
        doc.fileName,
        formatFileSize(doc.fileSizeByte),
        getFuzzyDate(doc.updateDate),
      ],
      category: doc.category,
      published: doc.published,
      image: imageSrc
        ? {
            src: imageSrc,
            width: 32,
            height: 32,
            gravity: "auto",
            className: "object-cover",
            radius: 0,
          }
        : undefined,
      menu: [
        { edit: { onClick: () => editDocument(doc.alias) } },
        {
          publish: {
            onClick: () => togglePublished(doc._id, doc.published, doc.url),
          },
        },
        { delete: { onClick: () => {} } },
      ],
    };
  });

  return (
    <Layout>
      <SectionHeader title={sectionTitle} newLink={newLink} />

      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={handleCloseSuccessMessage}
        />
      )}

      <DataList
        items={dataListItems}
        statuses={statuses}
        categories={categories}
        onDeleteConfirm={deleteDocument}
        deleteModalTitle="Dokument löschen"
        deleteModalDescription="Möchtest du das Dokument <strong>{{title}}</strong> wirklich löschen?"
        deleteModalDescriptionSubText="Dies kann nicht rückgängig gemacht werden."
        showThumbnails
        showStatusIndicator
      />
    </Layout>
  );
};

export default Documents;
