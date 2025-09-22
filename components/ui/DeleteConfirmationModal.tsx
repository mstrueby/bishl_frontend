import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string | null;
  description: string | null;
  descriptionSubText: string | null;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  descriptionSubText,
  isLoading = false
}) => {
  return (
    <>
      <Dialog open={isOpen} onClose={onClose} as="div"
        transition
        className="fixed z-10 focus:outline-none inset-0 flex w-screen items-center justify-center bg-black/30 transition-opacity p-4 duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0">
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              {title !== null && (
                <DialogTitle as="h3"
                  className="text-lg font-bold pb-4 leading-6 text-gray-900"
                >
                  {title}
                </DialogTitle>
              )}
              {description !== null && (
                <div className="mb-3">
                  <p className="text-base text-gray-800">
                    {description.split(/(<strong>.*?<\/strong>)/).map((part, index) => {
                      if (/<strong>.*<\/strong>/.test(part)) {
                        const text = part.replace(/<\/?strong>/g, '');
                        return <strong key={index} className="font-bold">{text}</strong>;
                      }
                      return <Fragment key={index}>{part}</Fragment>;
                    })}
                  </p>
                </div>
              )}
              {descriptionSubText !== null && (
                <p className="text-sm text-gray-500">{descriptionSubText}</p>
              )}

              <div className="mt-5 flex flex-col sm:flex-row justify-end items-end">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                      </svg>
                      Löschen...
                    </>
                  ) : (
                    'Löschen'
                  )}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default DeleteConfirmationModal;