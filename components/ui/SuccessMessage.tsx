import React from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

interface SuccessMessageProps {
  message: string | null;
  onClose: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => {
  if (!message) return null;
  
  // Replace <em> tags with <strong> tags
  const formatMessage = (msg: string) => {
    const regex = /<strong>(.*?)<\/strong>/g;
    const parts = msg.split(regex);
    return parts.map((part, index) => 
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
  };
  
  return (
      <div className="border-l-4 border-green-400 rounded-md bg-green-50 p-4 mb-4 md:mx-6 lg:mx-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{formatMessage(message)}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
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

export default SuccessMessage;