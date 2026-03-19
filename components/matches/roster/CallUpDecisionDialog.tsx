import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface CallUpDecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepOrigin: () => void;
  onUpgrade: () => void;
  isLoading: boolean;
  playerName: string;
  fromTeamName: string;
  toTeamName: string;
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const CallUpDecisionDialog: React.FC<CallUpDecisionDialogProps> = ({
  isOpen,
  onClose,
  onKeepOrigin,
  onUpgrade,
  isLoading,
  playerName,
  fromTeamName,
  toTeamName,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform rounded-lg bg-white shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Dialog.Title className="text-base font-semibold text-gray-900">
                        Entscheidung erforderlich
                      </Dialog.Title>
                      <div className="mt-2 text-sm text-gray-600 space-y-2">
                        <p>
                          <span className="font-medium text-gray-900">{playerName}</span>{" "}
                          hat das maximale Hochmeldelimit für{" "}
                          <span className="font-medium text-gray-900">{toTeamName}</span>{" "}
                          erreicht. Bevor der Spieler in einem weiteren Spiel eingesetzt werden kann,
                          muss eine dauerhafte Entscheidung getroffen werden.
                        </p>
                        <div className="rounded-md bg-red-50 border border-red-200 p-3">
                          <p className="text-sm font-medium text-red-800">
                            Diese Entscheidung ist permanent und kann nicht rückgängig gemacht werden.
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            Die Änderung wird sofort wirksam — unabhängig davon, ob die Aufstellung gespeichert wird.
                          </p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-2 text-xs text-gray-700">
                          <p>
                            <span className="font-semibold">Option 1 – Lizenz beim Ursprungsteam belassen:</span>{" "}
                            {playerName} bleibt dauerhaft bei{" "}
                            <span className="font-medium">{fromTeamName}</span> und kann nicht
                            weiter hochgemeldet werden.
                          </p>
                          <p>
                            <span className="font-semibold">Option 2 – Lizenz auf höheres Team umschreiben:</span>{" "}
                            Die Lizenz wird dauerhaft von{" "}
                            <span className="font-medium">{fromTeamName}</span> auf{" "}
                            <span className="font-medium">{toTeamName}</span> übertragen.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={onKeepOrigin}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <Spinner />}
                    Beim Ursprungsteam belassen
                  </button>
                  <button
                    type="button"
                    onClick={onUpgrade}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <Spinner />}
                    Lizenz umschreiben
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CallUpDecisionDialog;
