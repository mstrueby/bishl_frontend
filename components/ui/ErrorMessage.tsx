import { XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

interface ErrorMessageProps {
  error: string | null;
  onClose: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="border-l-4 border-red-400 rounded-md bg-red-50 p-4 mb-4 md:mx-0 lg:mx-0">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              onClick={onClose}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;