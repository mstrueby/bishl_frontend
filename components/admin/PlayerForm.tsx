import React, { useState, useEffect, Fragment } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputText from "../ui/form/InputText";
import { Switch, Menu, Transition } from "@headlessui/react";
import {
  PlayerValues,
  Assignment,
  AssignmentTeam,
} from "../../types/PlayerValues";
import ImageUpload from "../ui/form/ImageUpload";
import { CldImage } from "next-cloudinary";
import Badge from "../ui/Badge";
import Toggle from "../ui/form/Toggle";
import AssignmentModal from "../ui/AssignmentModal";
import { canAlsoPlayInAgeGroup } from "../../tools/consts";
import apiClient from "../../lib/apiClient";
import { classNames } from "../../tools/utils";
import {
  PencilIcon,
  SparklesIcon,
  CheckIcon,
  PlusCircleIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface PlayerFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  onPlayerUpdate: (player: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubId: string;
  clubName: string;
}

const invalidReasonCodeMap: Record<string, string> = {
  MULTIPLE_PRIMARY: "Mehrere Erstpässe vorhanden",
  TOO_MANY_LOAN: "Zu viele Leihpässe vorhanden",
  LOAN_CLUB_CONFLICT: "Leihpasskonflikt",
  AGE_GROUP_VIOLATION: "Altersklasse nicht erlaubt",
  OVERAGE_NOT_ALLOWED: "Over-Age nicht zulässig",
  EXCEEDS_WKO_LIMIT: "WKO-Limit überschritten",
  CONFLICTING_CLUB: "Widersprüchlicher Verein",
  IMPORT_CONFLICT: "Import-Konflikt",
  UNKNOWN_LICENCE_TYPE: "Unbekannter Passtyp",
  HOBBY_PLAYER_CONFLICT: "Hobbyspieler-Konflikt",
};

const licenceTypeBadgeColors: Record<string, string> = {
  PRIMARY: "bg-green-50 text-green-700 ring-green-600/20",
  SECONDARY: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  OVERAGE: "bg-pink-50 text-pink-700 ring-pink-600/20",
  LOAN: "bg-blue-50 text-blue-700 ring-blue-600/20",
  DEVELOPMENT: "bg-purple-50 text-purple-700 ring-purple-600/20",
  SPECIAL: "bg-red-50 text-red-700 ring-red-600/20",
};

const PlayerForm: React.FC<PlayerFormProps> = ({
  initialValues,
  onSubmit,
  onPlayerUpdate,
  enableReinitialize,
  handleCancel,
  loading,
  clubId,
  clubName,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AssignmentTeam | null>(null);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [masterDataLoading, setMasterDataLoading] = useState(false);
  const [licenceLoading, setLicenceLoading] = useState(false);
  const [savedMasterData, setSavedMasterData] = useState({
    displayFirstName: initialValues.displayFirstName,
    displayLastName: initialValues.displayLastName,
    imageUrl: initialValues.imageUrl,
    imageVisible: initialValues.imageVisible,
    managedByISHD: initialValues.managedByISHD,
  });

  useEffect(() => {
    setSavedMasterData({
      displayFirstName: initialValues.displayFirstName,
      displayLastName: initialValues.displayLastName,
      imageUrl: initialValues.imageUrl,
      imageVisible: initialValues.imageVisible,
      managedByISHD: initialValues.managedByISHD,
    });
  }, [initialValues]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  };

  const handleAutoOptimize = async (
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    setLicenceLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.post(
        `/players/${initialValues._id}/auto_optimize`,
        {
          assignedTeams: values.assignedTeams,
          keep_invalid: false,
        },
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showSuccess("Pässe erfolgreich optimiert.");
    } catch (error) {
      console.error("Error auto-optimizing:", error);
      showError("Fehler bei der Optimierung.");
    } finally {
      setLicenceLoading(false);
    }
  };

  const handleRevalidate = async (values: PlayerValues, setFieldValue: any) => {
    setLicenceLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.post(
        `/players/${initialValues._id}/revalidate`,
        {
          assignedTeams: values.assignedTeams,
          resetClassification: true,
          resetValidation: true,
        },
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showSuccess("Pässe erfolgreich validiert.");
    } catch (error) {
      console.error("Error revalidating:", error);
      showError("Fehler bei der Validierung.");
    } finally {
      setLicenceLoading(false);
    }
  };

  const handleRemoveLicence = async (
    assignment: Assignment,
    team: AssignmentTeam,
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    if (team.source === "ISHD" && initialValues.managedByISHD) {
      showError("ISHD-Pässe können nicht entfernt werden.");
      return;
    }

    setLicenceLoading(true);
    setErrorMessage(null);
    try {
      const updatedAssignments = values.assignedTeams
        .map((a) => {
          if (a.clubId === assignment.clubId) {
            return {
              ...a,
              teams: a.teams.filter((t) => t.teamId !== team.teamId),
            };
          }
          return a;
        })
        .filter((a) => a.teams.length > 0);

      const formData = new FormData();
      formData.append("assignedTeams", JSON.stringify(updatedAssignments));

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showSuccess("Pass erfolgreich entfernt.");
    } catch (error) {
      console.error("Error removing licence:", error);
      showError("Fehler beim Entfernen des Passes.");
    } finally {
      setLicenceLoading(false);
    }
  };

  const handleModalSave = async (
    updatedAssignedTeams: Assignment[],
    setFieldValue: any,
  ) => {
    setLicenceLoading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("assignedTeams", JSON.stringify(updatedAssignedTeams));

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showSuccess(
        editingTeam
          ? "Pass erfolgreich aktualisiert."
          : "Neuer Pass erfolgreich hinzugefügt.",
      );
    } catch (error) {
      console.error("Error saving assignment:", error);
      throw error;
    } finally {
      setLicenceLoading(false);
    }
  };

  const handleMasterDataSave = async (
    values: PlayerValues,
    setFieldValue: any,
    resetForm: any,
  ) => {
    setMasterDataLoading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();

      formData.append("displayFirstName", values.displayFirstName);
      formData.append("displayLastName", values.displayLastName);
      formData.append("imageVisible", String(values.imageVisible));
      formData.append("managedByISHD", String(values.managedByISHD));

      if (values.image instanceof File) {
        formData.append("image", values.image);
      } else if (values.imageUrl === null || values.imageUrl === "") {
        formData.append("imageUrl", "");
      }

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );

      const newMasterData = {
        displayFirstName: response.data.displayFirstName,
        displayLastName: response.data.displayLastName,
        imageUrl: response.data.imageUrl,
        imageVisible: response.data.imageVisible,
        managedByISHD: response.data.managedByISHD,
      };

      setSavedMasterData(newMasterData);

      setFieldValue("displayFirstName", newMasterData.displayFirstName);
      setFieldValue("displayLastName", newMasterData.displayLastName);
      setFieldValue("imageUrl", newMasterData.imageUrl);
      setFieldValue("imageVisible", newMasterData.imageVisible);
      setFieldValue("managedByISHD", newMasterData.managedByISHD);
      setFieldValue("image", undefined);

      onPlayerUpdate(response.data);
      setEditMode(false);
      showSuccess("Daten erfolgreich gespeichert.");
    } catch (error) {
      console.error("Error saving master data:", error);
      showError("Fehler beim Speichern der Daten.");
    } finally {
      setMasterDataLoading(false);
    }
  };

  const handleEditCancel = (setFieldValue: any) => {
    setFieldValue("displayFirstName", savedMasterData.displayFirstName);
    setFieldValue("displayLastName", savedMasterData.displayLastName);
    setFieldValue("imageUrl", savedMasterData.imageUrl);
    setFieldValue("imageVisible", savedMasterData.imageVisible);
    setFieldValue("managedByISHD", savedMasterData.managedByISHD);
    setFieldValue("image", undefined);
    setEditMode(false);
  };

  return (
    <>
      {successMessage && (
        <div className="mb-4 p-4 rounded-md bg-green-50 border-l-4 border-green-400">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Section 1: Non-editable master data */}
      <div className="mt-8">
        <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
          Stammdaten (nicht änderbar)
        </h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Diese Daten werden durch den ISHD verwaltet und können nicht geändert
          werden.
        </p>
      </div>
      <div className="mt-6 border-t border-b border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">
              Name, Vorname
            </dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {initialValues.lastName}, {initialValues.firstName}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">
              Geburtsdatum
            </dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {new Date(initialValues.birthdate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Geschlecht</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge info={initialValues.sex} />
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">
              Altersklasse
            </dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge
                info={
                  initialValues.ageGroup
                    ? `${initialValues.ageGroup}${initialValues.overAge ? " (OA)" : ""}`
                    : "?"
                }
              />
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Vollvisier</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <Badge
                info={
                  initialValues.fullFaceReq
                    ? "erforderlich"
                    : "nicht erforderlich"
                }
              />
            </dd>
          </div>
        </dl>
      </div>

      <Formik
        initialValues={initialValues}
        enableReinitialize={enableReinitialize}
        validationSchema={Yup.object({
          displayFirstName: Yup.string().required(
            "Der Vorname ist erforderlich",
          ),
          displayLastName: Yup.string().required(
            "Der Nachname ist erforderlich",
          ),
        })}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, setFieldValue, resetForm }) => (
          <Form>
            {/* Section 2: Editable master data */}
            <div className="mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
                    Änderbare Daten
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                    Diese Daten können für die BISHL-Anzeige angepasst werden.
                  </p>
                </div>
                {!editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <PencilIcon
                      className="-ml-0.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    Bearbeiten
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="mt-6 border-t border-b border-gray-100">
                  <dl className="divide-y divide-gray-100">
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-gray-900">
                        Angezeigter Vorname
                      </dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {savedMasterData.displayFirstName}
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-gray-900">
                        Angezeigter Nachname
                      </dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {savedMasterData.displayLastName}
                      </dd>
                    </div>

                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-gray-900">
                        Bild
                      </dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {savedMasterData.imageUrl ? (
                          <CldImage
                            src={savedMasterData.imageUrl}
                            alt="Spielerbild"
                            width={64}
                            height={64}
                            crop="thumb"
                            gravity="face"
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-gray-400">Kein Bild</span>
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-gray-900">
                        Foto sichtbar
                      </dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        <Badge
                          info={savedMasterData.imageVisible ? "Ja" : "Nein"}
                        />
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-gray-900">
                        Verwaltung
                      </dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        <span
                          className={classNames(
                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            savedMasterData.managedByISHD
                              ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                              : "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
                          )}
                        >
                          {savedMasterData.managedByISHD ? "ISHD" : "BISHL"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  {values.imageUrl ? (
                    <div className="mb-6">
                      <span className="block text-sm font-medium mb-2 leading-6 text-gray-900">
                        Bild
                      </span>
                      <CldImage
                        src={values.imageUrl}
                        alt="Spielerbild"
                        width={128}
                        height={128}
                        crop="thumb"
                        gravity="face"
                        className="rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => setFieldValue("imageUrl", null)}
                        className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                      >
                        Bild entfernen
                      </button>
                    </div>
                  ) : (
                    <ImageUpload
                      name="image"
                      label="Bild"
                      description="Das neue Bild wird erst nach Speichern hochgeladen."
                      imageUrl=""
                    />
                  )}

                  <Toggle
                    name="imageVisible"
                    label="Foto öffentlich anzeigen"
                  />
                  <InputText
                    name="displayFirstName"
                    autoComplete="off"
                    type="text"
                    label="Angezeigter Vorname"
                  />
                  <InputText
                    name="displayLastName"
                    autoComplete="off"
                    type="text"
                    label="Angezeigter Nachname"
                  />

                  <div className="mt-4">
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                      Verwaltung
                    </label>
                    <select
                      value={values.managedByISHD ? "ISHD" : "BISHL"}
                      onChange={(e) =>
                        setFieldValue(
                          "managedByISHD",
                          e.target.value === "ISHD",
                        )
                      }
                      className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      <option value="ISHD">ISHD</option>
                      <option value="BISHL">BISHL</option>
                    </select>
                  </div>

                  <div className="mt-6 flex justify-end gap-x-3">
                    <button
                      type="button"
                      onClick={() => handleEditCancel(setFieldValue)}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleMasterDataSave(values, setFieldValue, resetForm)
                      }
                      disabled={masterDataLoading}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                      {masterDataLoading ? "Speichern..." : "Speichern"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Licence table */}
            <div className="mt-12">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
                  Spielerpässe
                </h3>
                <div className="flex items-center gap-x-2">
                  <button
                    type="button"
                    onClick={() => handleAutoOptimize(values, setFieldValue)}
                    disabled={licenceLoading}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <SparklesIcon
                      className="-ml-0.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevalidate(values, setFieldValue)}
                    disabled={licenceLoading}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <CheckIcon
                      className="-ml-0.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam(null);
                      setEditingClubId(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <PlusCircleIcon
                      className="-ml-0.5 h-5 w-5"
                      aria-hidden="true"
                    />
                    Neu
                  </button>
                </div>
              </div>

              <AssignmentModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingTeam(null);
                  setEditingClubId(null);
                }}
                onSave={(updatedAssignedTeams) =>
                  handleModalSave(updatedAssignedTeams, setFieldValue)
                }
                playerId={initialValues._id}
                clubId={clubId}
                clubName={clubName}
                currentAssignments={values.assignedTeams || []}
                editingTeam={editingTeam}
                editingClubId={editingClubId}
              />

              {values.assignedTeams && values.assignedTeams.length > 0 ? (
                <div className="mt-4">
                  {values.assignedTeams.map((assignment, assignmentIndex) => {
                    const isOwnClub = assignment.clubId === clubId;
                    const showClubHeader =
                      values.assignedTeams.length > 1 || !isOwnClub;

                    return (
                      <div key={assignmentIndex} className="mb-6">
                        {showClubHeader && (
                          <div className="flex items-center gap-x-2 py-2 px-4 bg-gray-50 rounded-t-md">
                            <span className="text-sm font-semibold text-gray-900">
                              {assignment.clubName}
                            </span>
                            {assignment.clubType && (
                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                {assignment.clubType}
                              </span>
                            )}
                          </div>
                        )}
                        <table className="relative min-w-full">
                          <thead className="bg-white">
                            <tr>
                              <th
                                scope="col"
                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                              >
                                Team
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Typ
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Status
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Quelle
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Pass
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Aktiv
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                              >
                                Nr.
                              </th>
                              {isOwnClub && (
                                <th
                                  scope="col"
                                  className="py-3.5 pl-3 pr-4 sm:pr-3"
                                >
                                  <span className="sr-only">Aktionen</span>
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {assignment.teams.map((team, teamIndex) => {
                              const isValid =
                                team.status === "VALID" ||
                                team.status === "valid";
                              const canRemove = !(
                                team.source === "ISHD" &&
                                initialValues.managedByISHD
                              );

                              return (
                                <Fragment key={teamIndex}>
                                  <tr>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                      {team.teamName}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span
                                        className={classNames(
                                          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                          licenceTypeBadgeColors[
                                            team.licenseType
                                          ] ||
                                            "bg-gray-50 text-gray-700 ring-gray-600/20",
                                        )}
                                      >
                                        {team.licenseType}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <div className="flex items-center gap-x-2">
                                        <div
                                          className={classNames(
                                            "flex-none rounded-full p-1",
                                            isValid
                                              ? "text-green-500 bg-green-500/20"
                                              : "text-red-500 bg-red-500/20",
                                          )}
                                        >
                                          <div className="h-2 w-2 rounded-full bg-current" />
                                        </div>
                                        <span className="text-gray-700">
                                          {isValid ? "Gültig" : "Ungültig"}
                                        </span>
                                      </div>
                                      {!isValid &&
                                        team.invalidReasonCodes &&
                                        team.invalidReasonCodes.length > 0 && (
                                          <div className="mt-1 text-xs text-red-700">
                                            {team.invalidReasonCodes.map(
                                              (code, idx) => (
                                                <div key={idx}>
                                                  {invalidReasonCodeMap[code] ||
                                                    code}
                                                  {idx <
                                                    team.invalidReasonCodes
                                                      .length -
                                                      1}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span
                                        className={classNames(
                                          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                          team.source === "ISHD"
                                            ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                                            : "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
                                        )}
                                      >
                                        {team.source}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {team.passNo || "-"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <div className="flex items-center gap-x-2">
                                        <div
                                          className={classNames(
                                            "flex-none rounded-full p-1",
                                            team.active
                                              ? "text-green-500 bg-green-500/20"
                                              : "text-gray-500 bg-gray-800/10",
                                          )}
                                        >
                                          <div className="h-2 w-2 rounded-full bg-current" />
                                        </div>
                                        <span className="text-gray-500">
                                          {team.active ? "Aktiv" : "Inaktiv"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {team.jerseyNo || "-"}
                                    </td>
                                    {isOwnClub && (
                                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                        <Menu
                                          as="div"
                                          className="relative inline-block text-left"
                                        >
                                          <Menu.Button className="flex items-center rounded-full bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                            <span className="sr-only">
                                              Optionen öffnen
                                            </span>
                                            <EllipsisVerticalIcon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </Menu.Button>
                                          <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                          >
                                            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                              <div className="py-1">
                                                <Menu.Item>
                                                  {({ active }) => (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingTeam(team);
                                                        setEditingClubId(
                                                          assignment.clubId,
                                                        );
                                                        setIsModalOpen(true);
                                                      }}
                                                      className={classNames(
                                                        active
                                                          ? "bg-gray-100 text-gray-900"
                                                          : "text-gray-700",
                                                        "flex w-full items-center px-4 py-2 text-sm",
                                                      )}
                                                    >
                                                      <PencilIcon
                                                        className="mr-3 h-5 w-5 text-gray-400"
                                                        aria-hidden="true"
                                                      />
                                                      Bearbeiten
                                                    </button>
                                                  )}
                                                </Menu.Item>
                                                <Menu.Item
                                                  disabled={!canRemove}
                                                >
                                                  {({ active, disabled }) => (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleRemoveLicence(
                                                          assignment,
                                                          team,
                                                          values,
                                                          setFieldValue,
                                                        )
                                                      }
                                                      disabled={disabled}
                                                      className={classNames(
                                                        disabled
                                                          ? "text-gray-300 cursor-not-allowed"
                                                          : active
                                                            ? "bg-gray-100 text-gray-900"
                                                            : "text-gray-700",
                                                        "flex w-full items-center px-4 py-2 text-sm",
                                                      )}
                                                    >
                                                      <TrashIcon
                                                        className={classNames(
                                                          "mr-3 h-5 w-5",
                                                          disabled
                                                            ? "text-gray-300"
                                                            : "text-gray-400",
                                                        )}
                                                        aria-hidden="true"
                                                      />
                                                      Entfernen
                                                    </button>
                                                  )}
                                                </Menu.Item>
                                              </div>
                                            </Menu.Items>
                                          </Transition>
                                        </Menu>
                                      </td>
                                    )}
                                  </tr>
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 text-center py-8 text-gray-500">
                  Keine Spielerpässe vorhanden.
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Zurück
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default PlayerForm;
