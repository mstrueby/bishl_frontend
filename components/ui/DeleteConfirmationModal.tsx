import { Fragment } from 'react';
import { Dialog, Transition, DialogPanel, DialogTitle } from '@headlessui/react';

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => void,
  postTitle: string | null // Accept the post title as a prop
}> = ({ isOpen, onClose, onConfirm, postTitle }) => {
  return (
    <Transition
      show={isOpen}
      as={Fragment}
    >
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-md font-base leading-6 text-gray-900">
                    Möchtest du wirklich den Beitrag <span className="font-bold">{postTitle}</span> löschen?
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={onConfirm}
                >
                  Löschen
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteConfirmationModal;