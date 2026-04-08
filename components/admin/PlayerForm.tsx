import React, { useState, useEffect, Fragment, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputText from "../ui/form/InputText";
import { Switch, Menu, Transition, Dialog } from "@headlessui/react";
import {
  PlayerValues,
  Assignment,
  AssignmentTeam,
} from "../../types/PlayerValues";
import ImageUpload from "../ui/form/ImageUpload";
import { CldImage } from "next-cloudinary";
import Badge from "../ui/Badge";
import Toggle from "../ui/form/Toggle";
import SuccessMessage from "../ui/SuccessMessage";
import ErrorMessage from "../ui/ErrorMessage";
import AssignmentModal from "../ui/AssignmentModal";
import { canAlsoPlayInAgeGroup, ageGroupConfig } from "../../tools/consts";
import apiClient from "../../lib/apiClient";
import { classNames } from "../../tools/utils";
import {
  invalidReasonCodeMap,
  getLicenceTypeBadgeClass,
} from "../../lib/constants";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import {
  PencilIcon,
  SparklesIcon,
  CheckIcon,
  PlusCircleIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FlagIcon,
  ChevronDownIcon,
  CursorArrowRaysIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  LicenseType,
  LicenseStatus,
  LicenseInvalidReasonCode,
} from "../../types/PlayerValues";

const licenseTypeLabels: Record<string, string> = {
  PRIMARY: "PRIMARY",
  SECONDARY: "SECONDARY",
  OVERAGE: "OVERAGE",
  LOAN: "LOAN",
  HOBBY: "HOBBY",
  SPECIAL: "SPECIAL",
};

interface PlayerFormProps {
  initialValues: PlayerValues;
  onSubmit: (values: PlayerValues) => void;
  onPlayerUpdate: (player: PlayerValues) => void;
  enableReinitialize: boolean;
  handleCancel: () => void;
  loading: boolean;
  clubId?: string;
  clubName?: string;
  clubEmail?: string;
  isAdmin?: boolean;
  assignmentWindow?: any;
}

const PlayerForm: React.FC<PlayerFormProps> = ({
  initialValues,
  onSubmit,
  onPlayerUpdate,
  enableReinitialize,
  handleCancel,
  loading,
  clubId = "",
  clubName = "",
  clubEmail,
  isAdmin = false,
  assignmentWindow,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AssignmentTeam | null>(null);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [masterSuccessMessage, setMasterSuccessMessage] = useState<
    string | null
  >(null);
  const [masterErrorMessage, setMasterErrorMessage] = useState<string | null>(
    null,
  );
  const [licenceSuccessMessage, setLicenceSuccessMessage] = useState<
    string | null
  >(null);
  const [licenceErrorMessage, setLicenceErrorMessage] = useState<string | null>(
    null,
  );
  const [masterDataLoading, setMasterDataLoading] = useState(false);
  const [licenceLoading, setLicenceLoading] = useState(false);
  const masterSectionRef = useRef<HTMLDivElement>(null);
  const licenceSectionRef = useRef<HTMLDivElement>(null);
  const [savedMasterData, setSavedMasterData] = useState({
    displayFirstName: initialValues.displayFirstName,
    displayLastName: initialValues.displayLastName,
    imageUrl: initialValues.imageUrl,
    imageVisible: initialValues.imageVisible,
  });
  const [isPassCheckModalOpen, setIsPassCheckModalOpen] = useState(false);
  const [passCheckMessage, setPassCheckMessage] = useState("");
  const [passCheckLoading, setPassCheckLoading] = useState(false);
  const [managedByISHDLoading, setManagedByISHDLoading] = useState(false);
  const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] =
    useState(false);
  const [pendingRemoveData, setPendingRemoveData] = useState<{
    assignment: Assignment;
    team: AssignmentTeam;
    values: PlayerValues;
    setFieldValue: any;
  } | null>(null);
  const [stammdatenEditMode, setStammdatenEditMode] = useState(false);
  const [stammdatenLoading, setStammdatenLoading] = useState(false);
  const [stammdatenForm, setStammdatenForm] = useState({
    firstName: initialValues.firstName,
    lastName: initialValues.lastName,
    birthdate: initialValues.birthdate
      ? new Date(initialValues.birthdate).toLocaleDateString("en-CA", {
          timeZone: "Europe/Berlin",
        })
      : "",
    sex: initialValues.sex,
  });
  const [savedStammdaten, setSavedStammdaten] = useState({
    firstName: initialValues.firstName,
    lastName: initialValues.lastName,
    birthdate: initialValues.birthdate,
    sex: initialValues.sex,
    ageGroup: initialValues.ageGroup,
    fullFaceReq: initialValues.fullFaceReq,
  });
  const stammdatenSectionRef = useRef<HTMLDivElement>(null);
  const [stammdatenSuccessMessage, setStammdatenSuccessMessage] = useState<
    string | null
  >(null);
  const [stammdatenErrorMessage, setStammdatenErrorMessage] = useState<
    string | null
  >(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideTeam, setOverrideTeam] = useState<AssignmentTeam | null>(null);
  const [overrideAssignment, setOverrideAssignment] =
    useState<Assignment | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    licenseType: LicenseType.UNKNOWN,
    status: LicenseStatus.UNKNOWN,
    invalidReasonCodes: [] as LicenseInvalidReasonCode[],
    adminOverride: false,
    overrideReason: "",
    overrideDate: "",
  });
  const [overrideLoading, setOverrideLoading] = useState(false);

  const isOutsideAssignmentWindow = (() => {
    if (isAdmin || !assignmentWindow?.value) return false;
    const getValue = (key: string) =>
      assignmentWindow.value.find((v: any) => v.key === key)?.value;
    const enabled = getValue('ENABLED');
    if (!enabled) return false;
    const startMonth: number = getValue('START_MONTH');
    const startDay: number = getValue('START_DAY');
    const endMonth: number = getValue('END_MONTH');
    const endDay: number = getValue('END_DAY');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const afterStart =
      currentMonth > startMonth ||
      (currentMonth === startMonth && currentDay >= startDay);
    const beforeEnd =
      currentMonth < endMonth ||
      (currentMonth === endMonth && currentDay <= endDay);
    return !(afterStart && beforeEnd);
  })();

  useEffect(() => {
    setSavedMasterData({
      displayFirstName: initialValues.displayFirstName,
      displayLastName: initialValues.displayLastName,
      imageUrl: initialValues.imageUrl,
      imageVisible: initialValues.imageVisible,
    });
  }, [initialValues]);

  useEffect(() => {
    setSavedStammdaten({
      firstName: initialValues.firstName,
      lastName: initialValues.lastName,
      birthdate: initialValues.birthdate,
      sex: initialValues.sex,
      ageGroup: initialValues.ageGroup,
      fullFaceReq: initialValues.fullFaceReq,
    });
    setStammdatenForm({
      firstName: initialValues.firstName,
      lastName: initialValues.lastName,
      birthdate: initialValues.birthdate
        ? new Date(initialValues.birthdate).toLocaleDateString("en-CA", {
            timeZone: "Europe/Berlin",
          })
        : "",
      sex: initialValues.sex,
    });
  }, [initialValues]);

  const showMasterSuccess = (message: string) => {
    setMasterSuccessMessage(message);
    setMasterErrorMessage(null);
  };

  const showMasterError = (message: string) => {
    setMasterErrorMessage(message);
    setMasterSuccessMessage(null);
  };

  const showLicenceSuccess = (message: string) => {
    setLicenceSuccessMessage(message);
    setLicenceErrorMessage(null);
  };

  const showLicenceError = (message: string) => {
    setLicenceErrorMessage(message);
    setLicenceSuccessMessage(null);
  };

  const handleAutoOptimize = async (
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    setLicenceLoading(true);
    setLicenceErrorMessage(null);
    try {
      const response = await apiClient.post(
        `/players/${initialValues._id}/auto-optimize`,
        {
          assignedTeams: values.assignedTeams,
          keep_invalid: false,
        },
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showLicenceSuccess("Pässe erfolgreich optimiert.");
    } catch (error) {
      console.error("Error auto-optimizing:", error);
      showLicenceError("Fehler bei der Optimierung.");
    } finally {
      setLicenceLoading(false);
    }
  };

  const isLastOwnClubLicence = (
    assignment: Assignment,
    team: AssignmentTeam,
    values: PlayerValues,
  ): boolean => {
    if (assignment.clubId !== clubId) return false;
    const ownClub = values.assignedTeams?.find((a) => a.clubId === clubId);
    return ownClub ? ownClub.teams.length === 1 : false;
  };

  const handleRemoveLicenceRequest = (
    assignment: Assignment,
    team: AssignmentTeam,
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    if (team.source === "ISHD" && initialValues.managedByISHD) {
      showLicenceError(
        "ISHD-Pässe können nicht entfernt werden, solange die Verwaltung auf ISHD steht.",
      );
      return;
    }

    setPendingRemoveData({ assignment, team, values, setFieldValue });
    setIsRemoveConfirmationOpen(true);
  };

  const confirmRemoveLicence = () => {
    if (!pendingRemoveData) return;
    const { assignment, team, values, setFieldValue } = pendingRemoveData;
    handleRemoveLicence(assignment, team, values, setFieldValue);
    setIsRemoveConfirmationOpen(false);
    setPendingRemoveData(null);
  };

  const cancelRemoveLicence = () => {
    setIsRemoveConfirmationOpen(false);
    setPendingRemoveData(null);
  };

  const handleRemoveLicence = async (
    assignment: Assignment,
    team: AssignmentTeam,
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    setLicenceLoading(true);
    setLicenceErrorMessage(null);
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
      showLicenceSuccess("Pass erfolgreich entfernt.");

      const stillHasOwnClubLicence = (response.data.assignedTeams || []).some(
        (a: Assignment) => a.clubId === clubId && a.teams.length > 0,
      );
      if (!stillHasOwnClubLicence && editMode) {
        handleEditCancel(setFieldValue);
      }
    } catch (error) {
      console.error("Error removing licence:", error);
      showLicenceError("Fehler beim Entfernen des Passes.");
    } finally {
      setLicenceLoading(false);
    }
  };

  const handleModalSave = async (
    updatedAssignedTeams: Assignment[],
    setFieldValue: any,
  ) => {
    setLicenceLoading(true);
    setLicenceErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("assignedTeams", JSON.stringify(updatedAssignedTeams));

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showLicenceSuccess(
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
    setMasterErrorMessage(null);
    try {
      const formData = new FormData();

      formData.append("displayFirstName", values.displayFirstName);
      formData.append("displayLastName", values.displayLastName);
      formData.append("imageVisible", String(values.imageVisible));

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
      };

      setSavedMasterData(newMasterData);

      setFieldValue("displayFirstName", newMasterData.displayFirstName);
      setFieldValue("displayLastName", newMasterData.displayLastName);
      setFieldValue("imageUrl", newMasterData.imageUrl);
      setFieldValue("imageVisible", newMasterData.imageVisible);
      setFieldValue("image", undefined);

      onPlayerUpdate(response.data);
      setEditMode(false);
      showMasterSuccess("Daten erfolgreich gespeichert.");
      masterSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Error saving master data:", error);
      showMasterError("Fehler beim Speichern der Daten.");
    } finally {
      setMasterDataLoading(false);
    }
  };

  const handleManagedByISHDChange = async (
    newValue: boolean,
    setFieldValue: any,
  ) => {
    setManagedByISHDLoading(true);
    setLicenceErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("managedByISHD", String(newValue));

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );

      setFieldValue("managedByISHD", response.data.managedByISHD);
      onPlayerUpdate(response.data);
      showLicenceSuccess(
        `Verwaltung auf ${newValue ? "ISHD" : "BISHL"} geändert.`,
      );
    } catch (error) {
      console.error("Error updating managedByISHD:", error);
      showLicenceError("Fehler beim Ändern der Verwaltung.");
    } finally {
      setManagedByISHDLoading(false);
    }
  };

  const handleStammdatenSave = async () => {
    setStammdatenLoading(true);
    setStammdatenErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("firstName", stammdatenForm.firstName);
      formData.append("lastName", stammdatenForm.lastName);
      formData.append(
        "birthdate",
        new Date(stammdatenForm.birthdate).toISOString(),
      );
      formData.append("sex", stammdatenForm.sex);

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );

      setSavedStammdaten({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        birthdate: response.data.birthdate,
        sex: response.data.sex,
        ageGroup: response.data.ageGroup,
        fullFaceReq: response.data.fullFaceReq,
      });

      onPlayerUpdate(response.data);
      setStammdatenEditMode(false);
      setStammdatenSuccessMessage("Stammdaten erfolgreich gespeichert.");
      stammdatenSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Error saving stammdaten:", error);
      setStammdatenErrorMessage("Fehler beim Speichern der Stammdaten.");
    } finally {
      setStammdatenLoading(false);
    }
  };

  const handleStammdatenCancel = () => {
    setStammdatenForm({
      firstName: savedStammdaten.firstName,
      lastName: savedStammdaten.lastName,
      birthdate: savedStammdaten.birthdate
        ? new Date(savedStammdaten.birthdate).toLocaleDateString("en-CA", {
            timeZone: "Europe/Berlin",
          })
        : "",
      sex: savedStammdaten.sex,
    });
    setStammdatenEditMode(false);
    setStammdatenErrorMessage(null);
  };

  const handleOpenOverrideDialog = (
    assignment: Assignment,
    team: AssignmentTeam,
  ) => {
    setOverrideAssignment(assignment);
    setOverrideTeam(team);
    setOverrideForm({
      licenseType: (team.licenseType as LicenseType) || LicenseType.UNKNOWN,
      status: team.status || LicenseStatus.UNKNOWN,
      invalidReasonCodes: team.invalidReasonCodes || [],
      adminOverride: team.adminOverride || false,
      overrideReason: team.overrideReason || "",
      overrideDate: team.overrideDate || "",
    });
    setIsOverrideDialogOpen(true);
  };

  const handleOverrideSave = async (
    values: PlayerValues,
    setFieldValue: any,
  ) => {
    if (!overrideAssignment || !overrideTeam) return;
    setOverrideLoading(true);
    try {
      const updatedAssignments = values.assignedTeams.map((a) => {
        if (a.clubId === overrideAssignment.clubId) {
          return {
            ...a,
            teams: a.teams.map((t) => {
              if (t.teamId === overrideTeam.teamId) {
                return {
                  ...t,
                  licenseType: overrideForm.licenseType,
                  status: overrideForm.status,
                  invalidReasonCodes:
                    overrideForm.status === LicenseStatus.VALID
                      ? []
                      : overrideForm.invalidReasonCodes,
                  adminOverride: overrideForm.adminOverride,
                  overrideReason: overrideForm.adminOverride
                    ? overrideForm.overrideReason
                    : "",
                  overrideDate: overrideForm.adminOverride
                    ? overrideForm.overrideDate
                    : "",
                };
              }
              return t;
            }),
          };
        }
        return a;
      });

      const formData = new FormData();
      formData.append("assignedTeams", JSON.stringify(updatedAssignments));

      // debug formdata
      console.log("formData", updatedAssignments);

      const response = await apiClient.patch(
        `/players/${initialValues._id}`,
        formData,
      );
      setFieldValue("assignedTeams", response.data.assignedTeams);
      onPlayerUpdate(response.data);
      showLicenceSuccess("Überschreibung erfolgreich gespeichert.");
      setIsOverrideDialogOpen(false);
      setOverrideTeam(null);
      setOverrideAssignment(null);
    } catch (error) {
      console.error("Error saving override:", error);
      showLicenceError("Fehler beim Speichern der Überschreibung.");
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleEditCancel = (setFieldValue: any) => {
    setFieldValue("displayFirstName", savedMasterData.displayFirstName);
    setFieldValue("displayLastName", savedMasterData.displayLastName);
    setFieldValue("imageUrl", savedMasterData.imageUrl);
    setFieldValue("imageVisible", savedMasterData.imageVisible);
    setFieldValue("image", undefined);
    setEditMode(false);
  };

  const handlePassCheckRequest = async () => {
    if (!passCheckMessage.trim()) {
      return;
    }
    setPassCheckLoading(true);
    try {
      await apiClient.post("/players/pass-check-request", {
        player_id: initialValues._id,
        from_email: clubEmail || "",
        message: passCheckMessage.trim(),
      });
      showLicenceSuccess("Anfrage erfolgreich gesendet.");
      setIsPassCheckModalOpen(false);
      setPassCheckMessage("");
    } catch (error) {
      console.error("Error sending pass check request:", error);
      showLicenceError("Fehler beim Senden der Anfrage.");
    } finally {
      setPassCheckLoading(false);
    }
  };

  return (
    <>
      {/* Section 1: Master data (editable for admins) */}
      <div className="mt-8" ref={stammdatenSectionRef}>
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
              Stammdaten
            </h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
              {isAdmin
                ? "Diese Daten können von Administratoren bearbeitet werden."
                : "Diese Daten werden durch die Passstelle verwaltet und können nicht geändert werden."}
            </p>
          </div>
          {isAdmin && !stammdatenEditMode && (
            <button
              type="button"
              onClick={() => setStammdatenEditMode(true)}
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

        {stammdatenSuccessMessage && (
          <div className="mt-4">
            <SuccessMessage
              message={stammdatenSuccessMessage}
              onClose={() => setStammdatenSuccessMessage(null)}
            />
          </div>
        )}
        {stammdatenErrorMessage && (
          <div className="mt-4">
            <ErrorMessage
              error={stammdatenErrorMessage}
              onClose={() => setStammdatenErrorMessage(null)}
            />
          </div>
        )}

        {stammdatenEditMode && isAdmin ? (
          <div className="mt-6 pt-2">
            <div className="mt-2">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Vorname
              </label>
              <input
                type="text"
                value={stammdatenForm.firstName}
                onChange={(e) =>
                  setStammdatenForm({
                    ...stammdatenForm,
                    firstName: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Nachname
              </label>
              <input
                type="text"
                value={stammdatenForm.lastName}
                onChange={(e) =>
                  setStammdatenForm({
                    ...stammdatenForm,
                    lastName: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Geburtsdatum
              </label>
              <input
                type="date"
                value={stammdatenForm.birthdate}
                onChange={(e) =>
                  setStammdatenForm({
                    ...stammdatenForm,
                    birthdate: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Geschlecht
                </label>
                <div className="space-x-4" role="group">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="stammdaten-sex"
                      value="männlich"
                      checked={stammdatenForm.sex === "männlich"}
                      onChange={(e) =>
                        setStammdatenForm({
                          ...stammdatenForm,
                          sex: e.target.value as "männlich" | "weiblich",
                        })
                      }
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-900">männlich</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="stammdaten-sex"
                      value="weiblich"
                      checked={stammdatenForm.sex === "weiblich"}
                      onChange={(e) =>
                        setStammdatenForm({
                          ...stammdatenForm,
                          sex: e.target.value as "männlich" | "weiblich",
                        })
                      }
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="ml-2 text-sm text-gray-900">weiblich</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-x-3">
              <button
                type="button"
                onClick={handleStammdatenCancel}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleStammdatenSave}
                disabled={stammdatenLoading}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {stammdatenLoading ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-b border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">
                  Name, Vorname
                </dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {savedStammdaten.lastName}, {savedStammdaten.firstName}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">
                  Geburtsdatum
                </dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {new Date(savedStammdaten.birthdate).toLocaleDateString(
                    "de-DE",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    },
                  )}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">
                  Geschlecht
                </dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <Badge info={savedStammdaten.sex} />
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">
                  Altersklasse
                </dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <Badge
                    info={
                      savedStammdaten.ageGroup
                        ? `${savedStammdaten.ageGroup}`
                        : "?"
                    }
                  />
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">
                  Vollvisier
                </dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <Badge
                    info={
                      savedStammdaten.fullFaceReq
                        ? "erforderlich"
                        : "nicht erforderlich"
                    }
                  />
                </dd>
              </div>
            </dl>
          </div>
        )}
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
        {({ values, handleChange, setFieldValue, resetForm }) => {
          const hasNoOwnClubLicenceGlobal = !(values.assignedTeams || []).some(
            (a) => a.clubId === clubId && a.teams.length > 0,
          );
          const editDisabled = isAdmin ? false : hasNoOwnClubLicenceGlobal;

          return (
            <Form>
              {/* Section 2: Editable master data */}
              <div className="mt-12" ref={masterSectionRef}>
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
                      Änderbare Daten
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                      Diese Daten können für die Anzeige angepasst werden.
                    </p>
                  </div>
                  {!editMode && (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      disabled={editDisabled}
                      className={classNames(
                        "inline-flex items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300",
                        editDisabled
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-900 hover:bg-gray-50",
                      )}
                    >
                      <PencilIcon
                        className={classNames(
                          "-ml-0.5 h-5 w-5",
                          editDisabled ? "text-gray-300" : "text-gray-400",
                        )}
                        aria-hidden="true"
                      />
                      Bearbeiten
                    </button>
                  )}
                </div>

                {masterSuccessMessage && (
                  <div className="mt-4">
                    <SuccessMessage
                      message={masterSuccessMessage}
                      onClose={() => setMasterSuccessMessage(null)}
                    />
                  </div>
                )}
                {masterErrorMessage && (
                  <div className="mt-4">
                    <ErrorMessage
                      error={masterErrorMessage}
                      onClose={() => setMasterErrorMessage(null)}
                    />
                  </div>
                )}

                {!editMode ? (
                  <div className="mt-6 border-b border-gray-100">
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
                    </dl>
                  </div>
                ) : (
                  <div className="mt-6 pt-6">
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
              {(() => {
                const ownClubAssignment = values.assignedTeams?.find(
                  (a) => a.clubId === clubId,
                );
                const isLoanClub = ownClubAssignment?.teams.some(
                  (t) => t.licenseType === "LOAN",
                );
                const hasLoanLicence = isLoanClub;
                const hasNoOwnClubLicence =
                  !ownClubAssignment || ownClubAssignment.teams.length === 0;
                const isDisabled = isAdmin
                  ? false
                  : hasLoanLicence || hasNoOwnClubLicence;
                const isWindowOrRuleDisabled = isDisabled || isOutsideAssignmentWindow;

                const sortedAssignedTeams = [...(values.assignedTeams || [])]
                  .sort((a, b) => {
                    const aIsOwn = a.clubId === clubId;
                    const bIsOwn = b.clubId === clubId;
                    if (aIsOwn && !bIsOwn) return -1;
                    if (!aIsOwn && bIsOwn) return 1;
                    return a.clubName.localeCompare(b.clubName);
                  })
                  .map((assignment) => {
                    const sortedTeams = [...assignment.teams].sort(
                      (teamA, teamB) => {
                        const orderA =
                          ageGroupConfig.find(
                            (g) => g.key === teamA.teamAgeGroup,
                          )?.sortOrder || 999;
                        const orderB =
                          ageGroupConfig.find(
                            (g) => g.key === teamB.teamAgeGroup,
                          )?.sortOrder || 999;

                        if (orderA !== orderB) {
                          return orderA - orderB;
                        }

                        return (teamA.teamAlias || "").localeCompare(
                          teamB.teamAlias || "",
                        );
                      },
                    );
                    return { ...assignment, teams: sortedTeams };
                  });

                return (
                  <div className="mt-12" ref={licenceSectionRef}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-4 sm:gap-0">
                      <h3 className="text-base/7 font-semibold text-gray-900 uppercase">
                        Spielerpässe
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPassCheckModalOpen(true)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <FlagIcon
                            className="-ml-0.5 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="hidden sm:inline">Melden</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAutoOptimize(values, setFieldValue)
                          }
                          disabled={licenceLoading || isWindowOrRuleDisabled}
                          className={classNames(
                            "flex-1 sm:flex-none inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                            isWindowOrRuleDisabled
                              ? "bg-gray-50 text-gray-400 ring-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-900 ring-gray-300 hover:bg-gray-50",
                          )}
                        >
                          <SparklesIcon
                            className={classNames(
                              "-ml-0.5 h-5 w-5",
                              isWindowOrRuleDisabled ? "text-gray-300" : "text-gray-400",
                            )}
                            aria-hidden="true"
                          />
                          <span className="hidden sm:inline">Auto-Fix</span>
                        </button>
                        {(() => {
                          const buttonDisabled =
                            managedByISHDLoading || isWindowOrRuleDisabled;
                          return buttonDisabled ? (
                            <div
                              className={classNames(
                                "w-full sm:w-auto inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset cursor-not-allowed",
                                values.managedByISHD
                                  ? "bg-yellow-50/50 text-yellow-700/50 ring-yellow-600/10"
                                  : "bg-indigo-50/50 text-indigo-700/50 ring-indigo-600/10",
                              )}
                            >
                              <span className="flex items-center justify-between w-full sm:w-auto">
                                {managedByISHDLoading
                                  ? "..."
                                  : values.managedByISHD
                                    ? "ISHD"
                                    : "BISHL"}
                              </span>
                            </div>
                          ) : (
                            <Menu
                              as="div"
                              className="relative inline-block text-left flex-auto sm:flex-none"
                            >
                              <Menu.Button
                                className={classNames(
                                  "w-full sm:w-auto inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset",
                                  values.managedByISHD
                                    ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20 hover:bg-yellow-100"
                                    : "bg-indigo-50 text-indigo-700 ring-indigo-600/20 hover:bg-indigo-100",
                                )}
                              >
                                <span className="flex items-center justify-between w-full sm:w-auto">
                                  {values.managedByISHD ? "ISHD" : "BISHL"}
                                  <ChevronDownIcon
                                    className="-mr-1 ml-1 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
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
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleManagedByISHDChange(
                                              true,
                                              setFieldValue,
                                            )
                                          }
                                          disabled={values.managedByISHD}
                                          className={classNames(
                                            values.managedByISHD
                                              ? "bg-yellow-50 text-yellow-700"
                                              : active
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-gray-700",
                                            "flex w-full items-center px-4 py-2 text-sm",
                                          )}
                                        >
                                          <span
                                            className={classNames(
                                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                              "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
                                            )}
                                          >
                                            ISHD
                                          </span>
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleManagedByISHDChange(
                                              false,
                                              setFieldValue,
                                            )
                                          }
                                          disabled={!values.managedByISHD}
                                          className={classNames(
                                            !values.managedByISHD
                                              ? "bg-indigo-50 text-indigo-700"
                                              : active
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-gray-700",
                                            "flex w-full items-center px-4 py-2 text-sm",
                                          )}
                                        >
                                          <span
                                            className={classNames(
                                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                              "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
                                            )}
                                          >
                                            BISHL
                                          </span>
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeam(null);
                            setEditingClubId(null);
                            setIsModalOpen(true);
                          }}
                          disabled={isWindowOrRuleDisabled}
                          className={classNames(
                            "flex-1 sm:flex-none inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                            isWindowOrRuleDisabled
                              ? "bg-indigo-300 text-white cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600",
                          )}
                        >
                          <PlusCircleIcon
                            className="-ml-0.5 h-5 w-5"
                            aria-hidden="true"
                          />
                          <span className="hidden sm:inline">Neu</span>
                        </button>
                      </div>
                    </div>

                    {/** disable licence success message
                    {licenceSuccessMessage && (
                      <div className="mt-4">
                        <SuccessMessage
                          message={licenceSuccessMessage}
                          onClose={() => setLicenceSuccessMessage(null)}
                        />
                      </div>
                    )}
                    */}
                    {licenceErrorMessage && (
                      <div className="mt-4">
                        <ErrorMessage
                          error={licenceErrorMessage}
                          onClose={() => setLicenceErrorMessage(null)}
                        />
                      </div>
                    )}

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
                      managedByISHD={values.managedByISHD}
                      isAdmin={isAdmin}
                      lockTeamChange={!isAdmin && isOutsideAssignmentWindow}
                    />

                    <DeleteConfirmationModal
                      isOpen={isRemoveConfirmationOpen}
                      onClose={cancelRemoveLicence}
                      onConfirm={confirmRemoveLicence}
                      title="Pass entfernen"
                      description={`Möchtest du den Pass für <strong>${
                        pendingRemoveData?.team.teamName
                      }</strong> (${
                        pendingRemoveData?.team.teamAgeGroup
                      }) wirklich entfernen?${
                        pendingRemoveData &&
                        isLastOwnClubLicence(
                          pendingRemoveData.assignment,
                          pendingRemoveData.team,
                          pendingRemoveData.values,
                        )
                          ? " <strong>Hinweis:</strong> Dies ist der letzte Pass des Spielers für diesen Verein."
                          : ""
                      }`}
                      descriptionSubText="Diese Aktion kann nicht rückgängig gemacht werden."
                      isLoading={licenceLoading}
                    />

                    <Dialog
                      open={isPassCheckModalOpen}
                      onClose={() => {
                        setIsPassCheckModalOpen(false);
                        setPassCheckMessage("");
                      }}
                      className="relative z-50"
                    >
                      <div
                        className="fixed inset-0 bg-black/30"
                        aria-hidden="true"
                      />
                      <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                          <Dialog.Title className="text-lg font-semibold text-gray-900 text-center pb-2">
                            Pass melden
                          </Dialog.Title>
                          <Dialog.Description className="mt-2 text-sm text-gray-600">
                            Sende eine Anfrage an die Passstelle, damit sie den
                            Pass/die Pässe von{" "}
                            <strong>
                              {initialValues.displayFirstName}{" "}
                              {initialValues.displayLastName}
                            </strong>{" "}
                            überprüfen können. Beschreibe kurz den Sachverhalt.
                          </Dialog.Description>
                          <textarea
                            value={passCheckMessage}
                            onChange={(e) =>
                              setPassCheckMessage(e.target.value)
                            }
                            rows={4}
                            className="mt-4 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Nachricht eingeben..."
                          />
                          <div className="mt-6 flex justify-end gap-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPassCheckModalOpen(false);
                                setPassCheckMessage("");
                              }}
                              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Abbrechen
                            </button>
                            <button
                              type="button"
                              onClick={handlePassCheckRequest}
                              disabled={
                                passCheckLoading || !passCheckMessage.trim()
                              }
                              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {passCheckLoading
                                ? "Wird gesendet..."
                                : "Absenden"}
                            </button>
                          </div>
                        </Dialog.Panel>
                      </div>
                    </Dialog>

                    {isAdmin && (
                      <Dialog
                        open={isOverrideDialogOpen}
                        onClose={() => {
                          setIsOverrideDialogOpen(false);
                          setOverrideTeam(null);
                          setOverrideAssignment(null);
                        }}
                        className="relative z-50"
                      >
                        <div
                          className="fixed inset-0 bg-black/30"
                          aria-hidden="true"
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                          <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
                            <Dialog.Title className="text-lg font-semibold text-gray-900 text-center pb-2">
                              Pass überschreiben
                            </Dialog.Title>
                            {overrideTeam && (
                              <p className="mt-1 text-sm text-gray-500 text-center">
                                {overrideTeam.teamName}
                              </p>
                            )}

                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-900">
                                  Status überschreiben
                                </label>
                                <Switch
                                  checked={overrideForm.adminOverride}
                                  onChange={(checked: boolean) => {
                                    setOverrideForm({
                                      ...overrideForm,
                                      adminOverride: checked,
                                      overrideReason: checked
                                        ? overrideForm.overrideReason
                                        : "",
                                      overrideDate: checked
                                        ? new Date().toISOString()
                                        : "",
                                    });
                                  }}
                                  className={classNames(
                                    overrideForm.adminOverride
                                      ? "bg-indigo-600"
                                      : "bg-gray-200",
                                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                                  )}
                                >
                                  <span
                                    className={classNames(
                                      overrideForm.adminOverride
                                        ? "translate-x-5"
                                        : "translate-x-0",
                                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    )}
                                  />
                                </Switch>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-900">
                                  Passtyp
                                </label>
                                <select
                                  value={overrideForm.licenseType}
                                  disabled={!overrideForm.adminOverride}
                                  onChange={(e) =>
                                    setOverrideForm({
                                      ...overrideForm,
                                      licenseType: e.target
                                        .value as LicenseType,
                                    })
                                  }
                                  className="mt-1 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  {Object.entries(licenseTypeLabels).map(
                                    ([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-900">
                                  Status
                                </label>
                                <select
                                  value={overrideForm.status}
                                  disabled={!overrideForm.adminOverride}
                                  onChange={(e) => {
                                    const newStatus = e.target
                                      .value as LicenseStatus;
                                    setOverrideForm({
                                      ...overrideForm,
                                      status: newStatus,
                                      invalidReasonCodes:
                                        newStatus === LicenseStatus.VALID
                                          ? []
                                          : overrideForm.invalidReasonCodes,
                                    });
                                  }}
                                  className="mt-1 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value={LicenseStatus.VALID}>
                                    gültig
                                  </option>
                                  <option value={LicenseStatus.INVALID}>
                                    ungültig
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-900">
                                  Ungültigkeitsgründe
                                </label>
                                <div className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-500 bg-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 min-h-[2.25rem]">
                                  {overrideForm.status === LicenseStatus.VALID
                                    ? ""
                                    : (overrideForm.invalidReasonCodes || [])
                                        .map(
                                          (code) =>
                                            invalidReasonCodeMap[code] || code,
                                        )
                                        .join(", ") || "Keine"}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-900">
                                  Begründung
                                </label>
                                <textarea
                                  value={overrideForm.overrideReason}
                                  onChange={(e) =>
                                    setOverrideForm({
                                      ...overrideForm,
                                      overrideReason: e.target.value,
                                    })
                                  }
                                  disabled={!overrideForm.adminOverride}
                                  rows={3}
                                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-400"
                                  placeholder="Grund für die Überschreibung..."
                                />
                              </div>

                              {overrideForm.adminOverride &&
                                overrideForm.overrideDate && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-900">
                                      Überschreibungsdatum
                                    </label>
                                    <div className="mt-1 text-sm text-gray-500">
                                      {new Date(
                                        overrideForm.overrideDate,
                                      ).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-x-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOverrideDialogOpen(false);
                                  setOverrideTeam(null);
                                  setOverrideAssignment(null);
                                }}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                Abbrechen
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOverrideSave(values, setFieldValue)
                                }
                                disabled={overrideLoading}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                              >
                                {overrideLoading ? "Speichern..." : "Speichern"}
                              </button>
                            </div>
                          </Dialog.Panel>
                        </div>
                      </Dialog>
                    )}

                    {sortedAssignedTeams.length > 0 ? (
                      <div className="mt-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-b border-gray-200 mb-28">
                              <thead className="bg-white uppercase text-sm font-medium text-gray-500">
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-3"
                                  >
                                    Team
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-center"
                                  >
                                    Typ
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left"
                                  >
                                    Status
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-center"
                                  >
                                    Quelle
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-center"
                                  >
                                    Pass
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-center"
                                  >
                                    Aktiv
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-center"
                                  >
                                    Nr.
                                  </th>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-3 pr-4 sm:pr-3"
                                  >
                                    <span className="sr-only">Aktionen</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {sortedAssignedTeams.map((assignment) => {
                                  const isOwnClub =
                                    assignment.clubId === clubId;
                                  const showClubHeader =
                                    sortedAssignedTeams.length > 1 ||
                                    !isOwnClub;

                                  return (
                                    <Fragment key={assignment.clubId}>
                                      {showClubHeader && (
                                        <tr className="border-t border-gray-200">
                                          <th
                                            scope="colgroup"
                                            colSpan={8}
                                            className="bg-gray-50 py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3 space-x-3"
                                          >
                                            <span>{assignment.clubName}</span>
                                            {assignment.clubType && (
                                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                {assignment.clubType}
                                              </span>
                                            )}
                                          </th>
                                        </tr>
                                      )}
                                      {assignment.teams.map(
                                        (team, teamIndex) => {
                                          const isValid =
                                            team.status === "VALID";
                                          const canRemove = !(
                                            team.source === "ISHD" &&
                                            initialValues.managedByISHD
                                          );
                                          const showActions =
                                            isAdmin || isOwnClub;

                                          return (
                                            <tr
                                              key={team.teamId}
                                              className={classNames(
                                                teamIndex === 0 &&
                                                  !showClubHeader
                                                  ? "border-gray-300"
                                                  : "border-gray-200",
                                                "border-t",
                                              )}
                                            >
                                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                {team.teamName}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-center">
                                                <span
                                                  className={getLicenceTypeBadgeClass(
                                                    team.licenseType,
                                                  )}
                                                >
                                                  {team.licenseType}
                                                </span>
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
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
                                                  <span className="text-gray-700 flex items-center gap-x-1">
                                                    {isValid
                                                      ? "Gültig"
                                                      : "Ungültig"}
                                                    {team.adminOverride && (
                                                      <StarIcon
                                                        className="h-4 w-4 text-yellow-500 fill-yellow-500"
                                                        aria-hidden="true"
                                                      />
                                                    )}
                                                  </span>
                                                </div>
                                                {!isValid &&
                                                  team.invalidReasonCodes &&
                                                  team.invalidReasonCodes
                                                    .length > 0 && (
                                                    <div className="mt-1 text-xs font-normal text-red-800 space-y-0.5 ml-6">
                                                      {team.invalidReasonCodes.map(
                                                        (code, idx) => (
                                                          <div key={idx}>
                                                            {invalidReasonCodeMap[
                                                              code
                                                            ] || code}
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-center">
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
                                              <td className="whitespace-nowrap px-3 py-4 text-center text-sm font-medium text-gray-500">
                                                {team.passNo || "-"}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500">
                                                <div className="flex items-center justify-center lg:justify-start gap-x-2">
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
                                                  <span className="hidden lg:block text-gray-500">
                                                    {team.active
                                                      ? "Aktiv"
                                                      : "Inaktiv"}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500 text-center">
                                                {team.jerseyNo || "-"}
                                              </td>
                                              {showActions && (
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                  <Menu
                                                    as="div"
                                                    className="relative inline-block text-left"
                                                  >
                                                    <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
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
                                                      <Menu.Items className="absolute right-0 z-[100] mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="py-1">
                                                          <Menu.Item>
                                                            {({ active }) => (
                                                              <button
                                                                type="button"
                                                                onClick={() => {
                                                                  setEditingTeam(
                                                                    team,
                                                                  );
                                                                  setEditingClubId(
                                                                    assignment.clubId,
                                                                  );
                                                                  setIsModalOpen(
                                                                    true,
                                                                  );
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
                                                          {isAdmin && (
                                                            <Menu.Item>
                                                              {({ active }) => (
                                                                <button
                                                                  type="button"
                                                                  onClick={() =>
                                                                    handleOpenOverrideDialog(
                                                                      assignment,
                                                                      team,
                                                                    )
                                                                  }
                                                                  className={classNames(
                                                                    active
                                                                      ? "bg-gray-100 text-gray-900"
                                                                      : "text-gray-700",
                                                                    "flex w-full items-center px-4 py-2 text-sm",
                                                                  )}
                                                                >
                                                                  <CursorArrowRaysIcon
                                                                    className="mr-3 h-5 w-5 text-gray-400"
                                                                    aria-hidden="true"
                                                                  />
                                                                  Überschreiben
                                                                </button>
                                                              )}
                                                            </Menu.Item>
                                                          )}
                                                          <Menu.Item
                                                            disabled={
                                                              !canRemove || (!isAdmin && isOutsideAssignmentWindow)
                                                            }
                                                          >
                                                            {({
                                                              active,
                                                              disabled,
                                                            }) => (
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  handleRemoveLicenceRequest(
                                                                    assignment,
                                                                    team,
                                                                    values,
                                                                    setFieldValue,
                                                                  )
                                                                }
                                                                disabled={
                                                                  disabled
                                                                }
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
                                          );
                                        },
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-center py-8 text-gray-500">
                        Keine Spielerpässe vorhanden.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-end py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <ArrowUturnLeftIcon
                    className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  Zurück
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

export default PlayerForm;
