
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function ErrorState({ 
  message = 'An error occurred while loading data', 
  onRetry,
  showRetry = true 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
      <p className="mt-4 text-center text-gray-700">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
