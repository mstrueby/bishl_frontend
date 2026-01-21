
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { MatchValues, SupplementarySheet, Referee } from "../../../../types/MatchValues";
import { MatchdayOwner } from "../../../../types/TournamentValues";
import Layout from "../../../../components/Layout";
import useAuth from "../../../../hooks/useAuth";
import { ChevronLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  calculateMatchButtonPermissions,
  classNames,
} from "../../../../tools/utils";
import MatchHeader from "../../../../components/ui/MatchHeader";
import SectionHeader from "../../../../components/admin/SectionHeader";
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import SuccessMessage from '../../../../components/ui/SuccessMessage';
import LoadingState from '../../../../components/ui/LoadingState';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { Fragment } from 'react';
import { AssignmentValues } from '../../../../types/AssignmentValues';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { UserValues } from '../../../../types/UserValues';
import apiClient from '../../../../lib/apiClient';
import { getErrorMessage } from '../../../../lib/errorHandler';

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

interface OfficialCardProps {
  title: string;
  officialKey: 'timekeeper1' | 'timekeeper2' | 'technicalDirector';
  formData: SupplementarySheet;
  updateOfficialField: (
    officialKey: 'timekeeper1' | 'timekeeper2' | 'technicalDirector',
    field: 'firstName' | 'lastName' | 'licence',
    value: string,
  ) => void;
}

function OfficialCard({
  title,
  officialKey,
  formData,
  updateOfficialField,
}: OfficialCardProps) {
  const official = formData[officialKey];

  return (
    <div className="overflow-hidden bg-white rounded-md shadow-md border">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="text-sm text-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`${officialKey}FirstName`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Vorname
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`${officialKey}FirstName`}
                  placeholder=""
                  value={official?.firstName || ''}
                  onChange={(e) =>
                    updateOfficialField(officialKey, 'firstName', e.target.value)
                  }
                  className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`${officialKey}LastName`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Nachname
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`${officialKey}LastName`}
                  placeholder=""
                  value={official?.lastName || ''}
                  onChange={(e) =>
                    updateOfficialField(officialKey, 'lastName', e.target.value)
                  }
                  className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`${officialKey}Licence`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Lizenz
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`${officialKey}Licence`}
                  placeholder=""
                  value={official?.licence || ''}
                  onChange={(e) =>
                    updateOfficialField(officialKey, 'licence', e.target.value)
                  }
                  className="block min-w-0 grow bg-white py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RefereeChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  refereeNumber: 1 | 2;
  allReferees: UserValues[];
  selectedReferee: UserValues | null;
  setSelectedReferee: (referee: UserValues | null) => void;
  onConfirm: () => void;
}

function RefereeChangeDialog({
  isOpen,
  onClose,
  refereeNumber,
  allReferees,
  selectedReferee,
  setSelectedReferee,
  onConfirm,
}: RefereeChangeDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg text-center font-bold leading-6 text-gray-900 mb-4"
                >
                  Schiedsrichter {refereeNumber} ändern
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Wählen Sie einen neuen Schiedsrichter für Position {refereeNumber}
                  </p>
                  
                  <Listbox value={selectedReferee} onChange={setSelectedReferee}>
                    <div className="relative mt-1 z-50">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                        {selectedReferee ? (
                          <div className="flex items-center gap-x-3">
                            <div className="size-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                              {selectedReferee.firstName.charAt(0)}{selectedReferee.lastName.charAt(0)}
                            </div>
                            <span className="block truncate">
                              {selectedReferee.firstName} {selectedReferee.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="block truncate text-gray-400">(auswählen)</span>
                        )}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {[...allReferees].sort((a, b) => a.firstName.localeCompare(b.firstName)).map((referee) => (
                            <Listbox.Option
                              key={referee._id}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 px-3 ${
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={referee}
                            >
                              {({ selected, active }) => (
                                <div className="flex items-center gap-x-3">
                                  <div className="flex items-center gap-x-3 flex-1 truncate">
                                    <div className={`size-5 rounded-full flex items-center justify-center text-xs ${
                                      active ? 'bg-indigo-500' : 'bg-gray-100'
                                    }`}>
                                      {referee.firstName.charAt(0)}{referee.lastName.charAt(0)}
                                    </div>
                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                      {referee.firstName} {referee.lastName}
                                    </span>
                                  </div>
                                  {referee.referee?.club?.logoUrl && (
                                    <Image
                                      src={referee.referee.club.logoUrl}
                                      alt={referee.referee.club.clubName}
                                      width={24}
                                      height={24}
                                      className="object-contain"
                                    />
                                  )}
                                </div>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    onClick={onConfirm}
                    disabled={!selectedReferee}
                  >
                    Bestätigen
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function RefereeAttendanceCard({
  refereeNumber,
  formData,
  updateField,
  match,
  assignments,
  onOpenRefereeDialog,
}: {
  refereeNumber: 1 | 2;
  formData: SupplementarySheet;
  updateField: (field: string, value: any) => void;
  match: MatchValues;
  assignments: Assignment[];
  onOpenRefereeDialog: () => void;
}) {
  const referee = refereeNumber === 1 ? match.referee1 : match.referee2;
  const assignment = assignments.find(a => a.position === refereeNumber);
  const isDifferentReferee = assignment && referee && assignment.referee.userId !== referee.userId;

  const refereeTitle = referee ? (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-2 uppercase">
        Schiedsrichter {refereeNumber}
      </div>
      <div className="font-medium text-gray-800">
        {referee.firstName} {referee.lastName}
      </div>
      {referee.clubName && (
        <div className="text-xs font-normal text-gray-500">
          {referee.clubName}
        </div>
      )}
    </div>
  ) : (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-2 uppercase">
        Schiedsrichter {refereeNumber}
      </div>
      <div className="font-base text-gray-500">
        nicht eingeteilt
      </div>
      <div className="text-xs font-normal text-gray-500">
        &nbsp;
      </div>
    </div>
  );

  return (
    <div className={`overflow-hidden bg-white rounded-md shadow-md border ${isDifferentReferee ? 'border-red-600 border-2 shadow-red-500/50 shadow-lg' : ''}`}>
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5 flex items-center justify-between">
        <h4 className="text-sm">{refereeTitle}</h4>
        <button
          type="button"
          onClick={onOpenRefereeDialog}
          className="text-gray-400 hover:text-gray-600"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="text-sm text-gray-700 space-y-4">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}Pass`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Pass-Nr.
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}Delay`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Verspätung
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
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
      {isDifferentReferee && assignment && (
        <div className=" pt-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="text-xs text-gray-600">
            <div className="font-medium text-gray-600 mb-2">
              {assignment.status === 'ASSIGNED' ? 'Eingeteilt (nicht bestätigt)' : 'Eingeteilt (bestätigt)'}:
            </div>
            <div className='text-sm text-gray-800'>{assignment.referee.firstName} {assignment.referee.lastName}</div>
            {assignment.referee.clubName && (
              <div className="text-gray-500 pb-1">{assignment.referee.clubName}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RefereePaymentCardProps {
  refereeNumber: 1 | 2;
  formData: SupplementarySheet;
  updateRefereePayment: (
    refereeNumber: 1 | 2,
    field: string,
    value: number,
  ) => void;
  match: MatchValues;
}

function RefereePaymentCard({
  refereeNumber,
  formData,
  updateRefereePayment,
  match,
}: RefereePaymentCardProps) {
  const referee = refereeNumber === 1 ? match.referee1 : match.referee2;
  const paymentData =
    formData.refereePayment?.[
      `referee${refereeNumber}` as keyof typeof formData.refereePayment
    ];
  const total =
    (paymentData?.travelExpenses || 0) +
    (paymentData?.expenseAllowance || 0) +
    (paymentData?.gameFees || 0);

  const refereeTitle = referee ? (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-2 uppercase">
        Schiedsrichter {refereeNumber}
      </div>
      <div className="font-medium text-gray-800">
        {referee.firstName} {referee.lastName}
      </div>
      {referee.clubName && (
        <div className="text-xs font-normal text-gray-500">
          {referee.clubName}
        </div>
      )}
    </div>
  ) : (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-2 uppercase">
        Schiedsrichter {refereeNumber}
      </div>
      <div className="font-base text-gray-500">
        nicht eingeteilt
      </div>
      <div className="text-xs font-normal text-gray-500">
        &nbsp;
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden bg-white rounded-md shadow-md border">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-900/5">
        <h4 className="text-sm">{refereeTitle}</h4>
      </div>
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}TravelExpenses`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Fahrtkosten
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`referee${refereeNumber}TravelExpenses`}
                  placeholder="0,00"
                  value={paymentData?.travelExpenses || 0}
                  onChange={(e) =>
                    updateRefereePayment(
                      refereeNumber,
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}ExpenseAllowance`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Aufwandsentschädigung
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`referee${refereeNumber}ExpenseAllowance`}
                  placeholder="0,00"
                  value={paymentData?.expenseAllowance || 0}
                  onChange={(e) =>
                    updateRefereePayment(
                      refereeNumber,
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor={`referee${refereeNumber}GameFees`}
              className="block text-sm/6 font-medium text-gray-900"
            >
              Spielgebühren
            </label>
            <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
              <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                <input
                  type="text"
                  id={`referee${refereeNumber}GameFees`}
                  placeholder="0,00"
                  value={paymentData?.gameFees || 0}
                  onChange={(e) =>
                    updateRefereePayment(
                      refereeNumber,
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
              <span className="text-sm font-medium text-gray-900">Summe:</span>
              <span className="text-sm font-semibold text-gray-900">
                {total.toFixed(2).replace(".", ",")} €
              </span>
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

interface Assignment {
  _id: string;
  matchId: string;
  status: string;
  referee: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    clubId: string;
    clubName: string;
    logoUrl: string;
    level: string;
  };
  position: number;
}

export default function SupplementaryForm() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [match, setMatch] = useState<MatchValues | null>(null);
  const [matchdayOwner, setMatchdayOwner] = useState<MatchdayOwner | null>(null);
  const [formData, setFormData] = useState<SupplementarySheet>({
    timekeeper1: {},
    timekeeper2: {},
    technicalDirector: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [refereeDialogOpen, setRefereeDialogOpen] = useState(false);
  const [selectedRefereePosition, setSelectedRefereePosition] = useState<1 | 2>(1);
  const [allReferees, setAllReferees] = useState<UserValues[]>([]);
  const [selectedReferee, setSelectedReferee] = useState<UserValues | null>(null);

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);

  // Fetch all data on mount
  useEffect(() => {
    console.log('Supplementary page: fetchData effect triggered', { 
      authLoading, 
      user: !!user, 
      id,
      routerReady: router.isReady 
    });

    if (authLoading || !user || !id) {
      console.log('Supplementary page: fetchData guard return', { authLoading, user: !!user, id });
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Supplementary page: Starting fetchData API calls');
        setPageLoading(true);

        // Fetch match data
        const matchResponse = await apiClient.get(`/matches/${id}`);
        const matchData: MatchValues = matchResponse.data;
        console.log('Supplementary page: Match data fetched', matchData._id);
        setMatch(matchData);

        setFormData({
          ...matchData.supplementarySheet,
          timekeeper1: matchData.supplementarySheet?.timekeeper1 || {},
          timekeeper2: matchData.supplementarySheet?.timekeeper2 || {},
          technicalDirector: matchData.supplementarySheet?.technicalDirector || {},
        });

        // Fetch matchday owner
        try {
          const matchdayResponse = await apiClient.get(
            `/tournaments/${matchData.tournament.alias}/seasons/${matchData.season.alias}/rounds/${matchData.round.alias}/matchdays/${matchData.matchday.alias}`
          );
          console.log('Supplementary page: Matchday owner fetched');
          setMatchdayOwner(matchdayResponse.data?.owner || null);
        } catch (error) {
          console.error('Error fetching matchday owner:', getErrorMessage(error));
        }

        // Fetch assignments
        try {
          const assignmentsResponse = await apiClient.get(
            `/assignments/matches/${id}?assignmentStatus=ASSIGNED&assignmentStatus=ACCEPTED`
          );
          console.log('Supplementary page: Assignments fetched', assignmentsResponse.data?.length);
          setAssignments(assignmentsResponse.data || []);
        } catch (error) {
          console.error('Error fetching assignments:', getErrorMessage(error));
        }

        // Fetch all referees
        try {
          const refereesResponse = await apiClient.get('/users/referees');
          console.log('Supplementary page: Referees fetched', refereesResponse.data?.length);
          setAllReferees(refereesResponse.data || []);
        } catch (error) {
          console.error('Error fetching referees:', getErrorMessage(error));
        }

      } catch (error) {
        console.error('Supplementary page: Error fetching data:', getErrorMessage(error));
        setError('Fehler beim Laden der Daten');
      } finally {
        console.log('Supplementary page: fetchData finished, setting loading to false');
        setPageLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, id]);

  // Calculate permissions
  const permissions = match && user ? calculateMatchButtonPermissions(user, match, matchdayOwner || undefined) : {
    showButtonSupplementary: false
  };

  const handleOpenRefereeDialog = (position: 1 | 2) => {
    setSelectedRefereePosition(position);
    setRefereeDialogOpen(true);
  };

  const handleRefereeChange = async () => {
    if (!selectedReferee || !match) return;

    const refereeData = {
      userId: selectedReferee._id,
      firstName: selectedReferee.firstName,
      lastName: selectedReferee.lastName,
      clubId: selectedReferee.referee?.club?.clubId || '',
      clubName: selectedReferee.referee?.club?.clubName || '',
      logoUrl: selectedReferee.referee?.club?.logoUrl || '',
      points: selectedReferee.referee?.points || 0,
      level: selectedReferee.referee?.level || 'n/a'
    };

    const requestBody = {
      [`referee${selectedRefereePosition}`]: refereeData
    };

    try {
      const response = await apiClient.patch(`/matches/${match._id}`, requestBody);

      const updatedMatch = response.data;
      setMatch(updatedMatch);

      // Reset form values for the changed referee
      const resetFields = {
        [`referee${selectedRefereePosition}Present`]: false,
        [`referee${selectedRefereePosition}PassAvailable`]: false,
        [`referee${selectedRefereePosition}PassNo`]: '',
        [`referee${selectedRefereePosition}DelayMin`]: 0,
      };

      setFormData({ ...formData, ...resetFields });

      setSuccessMessage(`Schiedsrichter ${selectedRefereePosition} wurde erfolgreich geändert`);
      setRefereeDialogOpen(false);
      setSelectedReferee(null);

      // Refetch assignments
      try {
        const assignmentsResponse = await apiClient.get(
          `/assignments/matches/${match._id}?assignmentStatus=ASSIGNED&assignmentStatus=ACCEPTED`
        );
        setAssignments(assignmentsResponse.data || []);
      } catch (error) {
        console.error('Error fetching assignments:', getErrorMessage(error));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error updating referee:', getErrorMessage(error));
      setError(`Fehler beim Aktualisieren des Schiedsrichters: ${getErrorMessage(error)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const handleCloseErrorMessage = () => {
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.patch(
        `/matches/${match._id}`,
        {
          supplementarySheet: { ...formData, isSaved: true },
        }
      );

      // Ignore 304 Not Modified status
      if (response.status === 304) {
        setSuccessMessage('Keine Änderungen erforderlich');
        console.log('No changes needed (304)');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (response.status === 200) {
        setSuccessMessage("Zusatzblatt wurde erfolgreich gespeichert");
        const updatedFormData = { ...formData, isSaved: true };
        setFormData(updatedFormData);
        setMatch({ ...match, supplementarySheet: updatedFormData });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error saving supplementary sheet:", getErrorMessage(error));
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

  const updateOfficialField = (
    officialKey: 'timekeeper1' | 'timekeeper2' | 'technicalDirector',
    field: 'firstName' | 'lastName' | 'licence',
    value: string,
  ) => {
    setFormData({
      ...formData,
      [officialKey]: {
        ...formData[officialKey],
        [field]: value,
      },
    });
  };

  // Show loading state
  if (authLoading || pageLoading) {
    console.log('Supplementary page: Rendering LoadingState', { pageLoading, authLoading });
    return (
      <Layout>
        <LoadingState message="Lade Zusatzblatt..." />
      </Layout>
    );
  }

  // Return null while redirecting
  if (!user) {
    console.log('Supplementary page: No user, returning null');
    return null;
  }

  // Check permissions after loading
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
            <Link href={match ? `/matches/${match._id}` : '/'} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Zurück zum Spiel
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Match not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>
          Zusatzblatt - {match.home.shortName} - {match.away.shortName}
        </title>
      </Head>
      <Layout>
        <Link href={`/matches/${match._id}/matchcenter?tab=supplementary`} className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-base">
          <ChevronLeftIcon
            aria-hidden="true"
            className="h-3 w-3 text-gray-400"
          />
          <span className="ml-2">Match Center</span>
        </Link>

        <MatchHeader match={match} isRefreshing={false} onRefresh={() => {}} />

        <div className="mt-12">
          <SectionHeader title="Zusatzblatt" />

          <div className="sm:px-3 pb-2">
            {successMessage && (
              <SuccessMessage
                message={successMessage}
                onClose={handleCloseSuccessMessage}
              />
            )}
            {error && (
              <ErrorMessage error={error} onClose={handleCloseErrorMessage} />
            )}
          </div>

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
                    match={match}
                    assignments={assignments}
                    onOpenRefereeDialog={() => handleOpenRefereeDialog(refNumber as 1 | 2)}
                  />
                ))}
              </div>
            </div>

            {/* Officials Section */}
            <div>
              <SectionHeaderSimple
                title="Weitere Offizielle"
                description="Dieser Bereich ist von den <strong>Zeitnehmern</strong> auszufüllen"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <OfficialCard
                  title="Zeitnehmer 1"
                  officialKey="timekeeper1"
                  formData={formData}
                  updateOfficialField={updateOfficialField}
                />
                <OfficialCard
                  title="Zeitnehmer 2"
                  officialKey="timekeeper2"
                  formData={formData}
                  updateOfficialField={updateOfficialField}
                />
                <OfficialCard
                  title="Technischer Direktor"
                  officialKey="technicalDirector"
                  formData={formData}
                  updateOfficialField={updateOfficialField}
                />
              </div>
            </div>

            {/* Crowd Section */}
            <div>
              <SectionHeaderSimple
                title="Zuschauer"
                description="Dieser Bereich ist von den <strong>Zeitnehmern</strong> auszufüllen"
              />
              <div className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-md">
                  <label
                    htmlFor="crowd"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Anzahl Zuschauer
                  </label>
                  <div className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48">
                    <div className="flex items-center rounded-md bg-white px-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                      <input
                        type="number"
                        id="crowd"
                        placeholder="0"
                        min="0"
                        value={formData.crowd || 0}
                        onChange={(e) =>
                          updateField('crowd', parseInt(e.target.value) || 0)
                        }
                        className="block min-w-0 grow bg-white py-1.5 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6 text-right"
                      />
                    </div>
                  </div>
                </div>
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
                    key: "usageApproval",
                    label: "Nutzungserlaubnis",
                    description: "Eine gültige Nutzungserlaubnis liegt vor?",
                  },
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[1, 2].map((refNumber) => (
                  <RefereePaymentCard
                    key={refNumber}
                    refereeNumber={refNumber as 1 | 2}
                    formData={formData}
                    updateRefereePayment={updateRefereePayment}
                    match={match}
                  />
                ))}
              </div>

              {/* Overall Total */}
              <div className="mt-6 px-4">
                <div className="flex justify-end items-center space-x-8">
                  <span className="hidden sm:block text-sm font-medium text-gray-900">
                    Gesamtsumme Schiedsrichtervergütung:
                  </span>
                  <span className="sm:hidden text-sm font-medium text-gray-900">
                    Gesamtsumme:
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
                    )
                      .toFixed(2)
                      .replace(".", ",")}{" "}
                    €
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-8">
              <Link
                href={`/matches/${match._id}/matchcenter?tab=supplementary`}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-28 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                ) : (
                  "Speichern"
                )}
              </button>
            </div>
          </form>

          <RefereeChangeDialog
            isOpen={refereeDialogOpen}
            onClose={() => {
              setRefereeDialogOpen(false);
              setSelectedReferee(null);
            }}
            refereeNumber={selectedRefereePosition}
            allReferees={allReferees}
            selectedReferee={selectedReferee}
            setSelectedReferee={setSelectedReferee}
            onConfirm={handleRefereeChange}
          />
        </div>
      </Layout>
    </>
  );
}
