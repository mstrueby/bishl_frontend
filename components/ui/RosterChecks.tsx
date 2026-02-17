import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { RosterCheckResult } from '../../utils/rosterValidation';

interface RosterChecksProps {
  checks: RosterCheckResult[];
}

const RosterChecks: React.FC<RosterChecksProps> = ({ checks }) => {
  if (checks.length === 0) return null;

  return (
    <div className="p-6 border-t bg-gray-50">
      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.key} className="flex items-center">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center ${
                check.passed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}
            >
              {check.passed ? (
                <CheckCircleIcon className="h-6 w-6" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6" />
              )}
            </div>
            <span className="ml-2 text-sm">
              {check.passed ? check.messagePass : check.messageFail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RosterChecks;
