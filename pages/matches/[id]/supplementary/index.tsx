import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Match, SupplementarySheet } from "../../../../types/MatchValues";
import { MatchdayOwner } from "../../../../types/TournamentValues";
import Layout from "../../../../components/Layout";
import { getCookie } from "cookies-next";
import axios from "axios";
import useAuth from "../../../../hooks/useAuth";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  calculateMatchButtonPermissions,
  classNames,
} from "../../../../tools/utils";
import MatchHeader from "../../../../components/ui/MatchHeader";
import SectionHeader from "../../../../components/admin/SectionHeader";

interface SectionHeaderSimpleProps {
  title: string;
  description?: string;
}

function SectionHeaderSimple({ title, description }: SectionHeaderSimpleProps) {
  return (
    <div className="mb-6 pb-3 flex items-center justify-between min-h-[2.5rem]">
      <div className="min-w-0 flex-1">
        <h3 className="text-md font-semibold text-gray-900 pt-1.5 truncate">
          {title}
        </h3>
        {description && (
          <p
            className="mt-0 text-xs text-gray-500"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>
    </div>
  );
}

interface RefereeAttendanceCardProps {
  refereeNumber: 1 | 2;
  formData: SupplementarySheet;
  updateField: (field: string, value: any) => void;
}

function RefereeAttendanceCard({
  refereeNumber,
  formData,
  updateField,
}: RefereeAttendanceCardProps) {
  return (
    <div className="overflow-hidden bg-white rounded-md shadow-md border">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm font-medium text-gray-800">
          Schiedsrichter {refereeNumber}
        </h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="text-sm text-gray-700 space-y-4">
          {/** Referee present */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Anwesend</span>
            <button
              type="button"
              onClick={() =>
                updateField(
                  `referee${refereeNumber}Present`,
                  !formData[
                    `referee${refereeNumber}Present` as keyof SupplementarySheet
                  ],
                )
              }
              className={classNames(
                formData[
                  `referee${refereeNumber}Present` as keyof SupplementarySheet
                ]
                  ? "bg-indigo-600"
                  : "bg-gray-200",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
              )}
            >
              <span
                className={classNames(
                  formData[
                    `referee${refereeNumber}Present` as keyof SupplementarySheet
                  ]
                    ? "translate-x-5"
                    : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                )}
              />
            </button>
          </div>
          {/** Referee pass available */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              Pass liegt vor
            </span>
            <button
              type="button"
              onClick={() =>
                updateField(
                  `referee${refereeNumber}PassAvailable`,
                  !formData[
                    `referee${refereeNumber}PassAvailable` as keyof SupplementarySheet
                  ],
                )
              }
              className={classNames(
                formData[
                  `referee${refereeNumber}PassAvailable` as keyof SupplementarySheet
                ]
                  ? "bg-indigo-600"
                  : "bg-gray-200",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
              )}
            >
              <span
                className={classNames(
                  formData[
                    `referee${refereeNumber}PassAvailable` as keyof SupplementarySheet
                  ]
                    ? "translate-x-5"
                    : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                )}
              />
            </button>
          </div>
          {/** Referee pass number */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}Pass`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Pass-Nr.
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-32">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  name={`referee${refereeNumber}Pass`}
                  id={`referee${refereeNumber}pass`}
                  placeholder=""
                  value={
                    (formData[
                      `referee${refereeNumber}PassNo` as keyof SupplementarySheet
                    ] as string) || ""
                  }
                  onChange={(e) =>
                    updateField(`referee${refereeNumber}PassNo`, e.target.value)
                  }
                  className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                />
              </div>
            </div>
          </div>
          {/** Referee delay */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}Delay`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Verspätung
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-32">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  name={`referee${refereeNumber}Delay`}
                  id={`referee${refereeNumber}delay`}
                  placeholder="0"
                  value={
                    (formData[
                      `referee${refereeNumber}DelayMin` as keyof SupplementarySheet
                    ] as number) || 0
                  }
                  onChange={(e) =>
                    updateField(
                      `referee${refereeNumber}DelayMin`,
                      parseInt(e.target.value) || 0,
                    )
                  }
                  aria-describedby="delay-in-minutes"
                  className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                />
                <div
                  id="delay-in-minutes"
                  className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6"
                >
                  Min.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamEquipmentCardProps {
  teamName: string;
  teamType: "home" | "away";
  formData: SupplementarySheet;
  updateField: (field: string, value: any) => void;
}

function TeamEquipmentCard({
  teamName,
  teamType,
  formData,
  updateField,
}: TeamEquipmentCardProps) {
  const items =
    teamType === "home"
      ? [
          {
            key: "homeRoster",
            label: "Aufstellung rechtzeitig veröffentlicht",
            description: "Wurde die Aufstellung fristgerecht veröffentlicht?",
          },
          {
            key: "homePlayerPasses",
            label: "Spielerpässe vollständig",
            description: "Liegen alle Spielerpässe vor?",
          },
          {
            key: "homeUniformPlayerClothing",
            label: "Einheitliche Spielerkleidung",
            description: "Einheitliche Helme, Trikots, Hosen?",
          },
        ]
      : [
          {
            key: "awayRoster",
            label: "Aufstellung rechtzeitig veröffentlicht",
            description: "Wurde die Aufstellung fristgerecht veröffentlicht?",
          },
          {
            key: "awayPlayerPasses",
            label: "Spielerpässe vollständig",
            description: "Liegen alle Spielerpässe vor?",
          },
          {
            key: "awayUniformPlayerClothing",
            label: "Einheitliche Spielerkleidung",
            description: "Einheitliche Helme, Trikots, Hosen?",
          },
          {
            key: "awaySecondJerseySet",
            label: "Zweiter Trikotsatz",
            description:
              "Ist bei Farbkonflikten ein zweiter Trikotsatz verfügbar?",
          },
        ];

  return (
    <div className="overflow-hidden bg-white rounded-md shadow-md border">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm font-medium text-gray-800">
          {teamType === "home" ? "HEIM" : "GAST"} - {teamName}
        </h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="text-sm text-gray-700 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
                <span className="text-xs text-gray-500">
                  {item.description}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField(
                    item.key,
                    !formData[item.key as keyof SupplementarySheet],
                  )
                }
                className={classNames(
                  formData[item.key as keyof SupplementarySheet]
                    ? "bg-indigo-600"
                    : "bg-gray-200",
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                )}
              >
                <span
                  className={classNames(
                    formData[item.key as keyof SupplementarySheet]
                      ? "translate-x-5"
                      : "translate-x-0",
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SupplementaryFormProps {
  match: Match;
  matchdayOwner: MatchdayOwner;
  jwt?: string;
}

export default function SupplementaryForm({
  match: initialMatch,
  matchdayOwner,
  jwt,
}: SupplementaryFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match>(initialMatch);
  const [formData, setFormData] = useState<SupplementarySheet>(
    match.supplementarySheet || {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const permissions = calculateMatchButtonPermissions(
    user,
    match,
    matchdayOwner,
  );

  // Check permissions
  if (!permissions.showButtonSupplementary) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nicht berechtigt
            </h2>
            <p className="text-gray-500 mb-4">
              Sie haben keine Berechtigung, das Zusatzblatt zu bearbeiten.
            </p>
            <Link href={`/matches/${match._id}/matchcenter?tab=supplementary`}>
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Zurück zum Match Center
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/${match._id}`,
        {
          supplementarySheet: formData,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200) {
        setSuccessMessage("Zusatzblatt wurde erfolgreich gespeichert");
        setMatch({ ...match, supplementarySheet: formData });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error saving supplementary sheet:", error);
      setError("Fehler beim Speichern des Zusatzblatts");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateRefereePayment = (
    refereeNumber: 1 | 2,
    field: string,
    value: number,
  ) => {
    setFormData({
      ...formData,
      refereePayment: {
        ...formData.refereePayment,
        [`referee${refereeNumber}`]: {
          ...formData.refereePayment?.[
            `referee${refereeNumber}` as keyof typeof formData.refereePayment
          ],
          [field]: value,
        },
      },
    });
  };

  return (
    <>
      <Head>
        <title>
          Zusatzblatt - {match.home.shortName} - {match.away.shortName}
        </title>
      </Head>
      <Layout>
        <Link href={`/matches/${match._id}/matchcenter?tab=supplementary`}>
          <a className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-base">
            <ChevronLeftIcon
              aria-hidden="true"
              className="h-3 w-3 text-gray-400"
            />
            <span className="ml-2">Match Center</span>
          </a>
        </Link>

        <MatchHeader match={match} isRefreshing={false} onRefresh={() => {}} />

        <div className="mt-12">
          <SectionHeader title="Zusatzblatt" />

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-700">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Referee Attendance Section */}
            <div>
              <SectionHeaderSimple
                title="Schiedsrichter"
                description="Dieser Bereich ist von den <strong>Zeitnehmern</strong> auszufüllen"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((refNumber) => (
                  <RefereeAttendanceCard
                    key={refNumber}
                    refereeNumber={refNumber as 1 | 2}
                    formData={formData}
                    updateField={updateField}
                  />
                ))}
              </div>
            </div>

            {/* Documents/Equipment Section */}
            <div>
              <SectionHeaderSimple
                title="Dokumente / Ausrüstung"
                description="Dieser Bereich ist von den <strong>Schiedsrichtern</strong> auszufüllen"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "ruleBook",
                    label: "Spielregeln/WKO",
                    description:
                      "Sind die aktuellen Spielregeln und WKO verfügbar?",
                  },
                  {
                    key: "goalDisplay",
                    label: "Manuelle Toranzeige",
                    description: "Ist eine manuelle Toranzeige vorhanden?",
                  },
                  {
                    key: "soundSource",
                    label: "Ersatz-Tonquelle",
                    description:
                      "Ist eine Ersatz-Tonquelle (Pfeife/Horn) verfügbar?",
                  },
                  {
                    key: "matchClock",
                    label: "Spieluhr",
                    description: "Ist eine funktionierende Spieluhr vorhanden?",
                  },
                  {
                    key: "matchBalls",
                    label: "10 Spielbälle",
                    description:
                      "Sind mind. 10 regelkonforme Spielbälle verfügbar?",
                  },
                  {
                    key: "firstAidKit",
                    label: "Erste-Hilfe-Ausrüstung",
                    description:
                      "Ist vollständige Erste-Hilfe-Ausrüstung vorhanden?",
                  },
                  {
                    key: "fieldLines",
                    label: "Pflichtlinien",
                    description:
                      "Ist das Spielfeld vollständig mit allen Pflichtlinien markiert?",
                  },
                  {
                    key: "nets",
                    label: "Tornetze",
                    description: "Sind regelkonforme Tornetze angebracht?",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between  px-4 sm:px-6"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          item.key,
                          !formData[item.key as keyof SupplementarySheet],
                        )
                      }
                      className={classNames(
                        formData[item.key as keyof SupplementarySheet]
                          ? "bg-indigo-600"
                          : "bg-gray-200",
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                      )}
                    >
                      <span
                        className={classNames(
                          formData[item.key as keyof SupplementarySheet]
                            ? "translate-x-5"
                            : "translate-x-0",
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Equipment Section */}
            <div>
              <SectionHeaderSimple
                title="Mannschaften"
                description="Dieser Bereich ist von den <strong>Schiedsrichtern</strong> auszufüllen"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamEquipmentCard
                  teamName={match.home.fullName}
                  teamType="home"
                  formData={formData}
                  updateField={updateField}
                />
                <TeamEquipmentCard
                  teamName={match.away.fullName}
                  teamType="away"
                  formData={formData}
                  updateField={updateField}
                />
              </div>
            </div>

            {/* Special Events Section */}
            <div>
              <SectionHeaderSimple
                title="Besondere Vorkommnisse"
                description="Dieser Bereich ist von den <strong>Schiedsrichtern</strong> auszufüllen"
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 sm:px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Besondere Vorkommnisse
                    </span>
                    <span className="text-xs text-gray-500">
                      Gab es Vorkomnisse, die dokumentiert werden müssen?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateField("specialEvents", !formData.specialEvents)
                    }
                    className={classNames(
                      formData.specialEvents ? "bg-indigo-600" : "bg-gray-200",
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                    )}
                  >
                    <span
                      className={classNames(
                        formData.specialEvents
                          ? "translate-x-5"
                          : "translate-x-0",
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      )}
                    />
                  </button>
                </div>

                <div className="px-4 sm:px-6">
                  <label className="block text-sm/6 font-medium text-gray-900 mb-2">
                    Schiedsrichter Kommentare
                  </label>
                  <textarea
                    value={formData.refereeComments || ""}
                    onChange={(e) =>
                      updateField("refereeComments", e.target.value)
                    }
                    rows={4}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    placeholder="Kommentare des Schiedsrichters..."
                  />
                </div>
              </div>
            </div>

            {/* Referee Payment Section */}
            <div>
              <SectionHeaderSimple
                title="Schiedsrichtervergütung"
                description="Dieser Bereich ist von den <strong>Schiedsrichtern</strong> auszufüllen"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((refNumber) => {
                  const paymentData =
                    formData.refereePayment?.[
                      `referee${refNumber}` as keyof typeof formData.refereePayment
                    ];
                  const total =
                    (paymentData?.travelExpenses || 0) +
                    (paymentData?.expenseAllowance || 0) +
                    (paymentData?.gameFees || 0);

                  return (
                    <div key={refNumber}>
                      <h4 className="text-md font-medium text-gray-800 mb-4">
                        Schiedsrichter {refNumber}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="price"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                          >
                            Fahrtkosten
                          </label>
                          <div className="mt-2">
                            <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                              <input
                                type="text"
                                placeholder="0,00"
                                value={paymentData?.travelExpenses || 0}
                                onChange={(e) =>
                                  updateRefereePayment(
                                    refNumber as 1 | 2,
                                    "travelExpenses",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                aria-describedby="price-currency"
                                className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                              />
                              <div
                                id="price-currency"
                                className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6"
                              >
                                €
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="price"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                          >
                            Aufwandsentschädigung
                          </label>
                          <div className="mt-2">
                            <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                              <input
                                type="text"
                                placeholder="0,00"
                                value={paymentData?.expenseAllowance || 0}
                                onChange={(e) =>
                                  updateRefereePayment(
                                    refNumber as 1 | 2,
                                    "expenseAllowance",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                aria-describedby="price-currency"
                                className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                              />
                              <div
                                id="price-currency"
                                className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6"
                              >
                                €
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="price"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                          >
                            Spielgebühren
                          </label>
                          <div className="mt-2">
                            <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                              <input
                                type="text"
                                placeholder="0,00"
                                value={paymentData?.gameFees || 0}
                                onChange={(e) =>
                                  updateRefereePayment(
                                    refNumber as 1 | 2,
                                    "gameFees",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                aria-describedby="price-currency"
                                className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                              />
                              <div
                                id="price-currency"
                                className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6"
                              >
                                €
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Summe:
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {total.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Total */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    Gesamtsumme Schiedsrichtervergütung:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {(
                      (formData.refereePayment?.referee1?.travelExpenses || 0) +
                      (formData.refereePayment?.referee1?.expenseAllowance ||
                        0) +
                      (formData.refereePayment?.referee1?.gameFees || 0) +
                      (formData.refereePayment?.referee2?.travelExpenses || 0) +
                      (formData.refereePayment?.referee2?.expenseAllowance ||
                        0) +
                      (formData.refereePayment?.referee2?.gameFees || 0)
                    ).toFixed(2)}{" "}
                    €
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href={`/matches/${match._id}/matchcenter?tab=supplementary`}
              >
                <a className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Abbrechen
                </a>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"
                      ></path>
                    </svg>
                    Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const jwt = (getCookie("jwt", context) || "") as string;

  try {
    const match: Match = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`,
    ).then((res) => res.json());

    const matchday = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tournaments/${match.tournament.alias}/seasons/${match.season.alias}/rounds/${match.round.alias}/matchdays/${match.matchday.alias}/`,
    ).then((res) => res.json());

    return {
      props: {
        match,
        matchdayOwner: matchday.owner,
        jwt,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
