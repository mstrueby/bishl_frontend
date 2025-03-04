import React from 'react';
import { classNames } from '../../tools/utils';

const status = [
  { key: 'INPROGRESS', value: 'Live', bdg_col_light: 'bg-red-600 text-white ring-red-700' },
  { key: 'FINISHED', value: 'beendet', bdg_col_light: 'bg-gray-600 text-white ring-gray-700' },
  { key: 'CANCELLED', value: 'abgesagt', bdg_col_light: 'bg-amber-100 text-amber-700 ring-amber-700/10' },
  { key: 'FORFEITED', value: 'gewertet', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-400' },
]

const MatchStatusBadge: React.FC<{ statusKey: string, finishTypeKey?: string, statusValue: string, finishTypeValue?: string }> = ({ statusKey, finishTypeKey, statusValue, finishTypeValue }) => {
  return (
    <>
      {status.map(item => (
        item.key === statusKey && (
          <span
            key={item.key}
            className={classNames("inline-flex items-center gap-x-1.5 rounded-md text-xs font-medium ring-1 ring-inset py-0.5 px-2 uppercase", item.bdg_col_light)}
          >
            {statusValue}
            {item.key === 'FINISHED' && finishTypeKey !== 'REGULAR' && (
              <span>
                {finishTypeKey === 'SHOOTOUT' ? '(PS)' : finishTypeKey === 'OVERTIME' ? '(V)' : finishTypeValue}
              </span>
            )}
          </span>
        )
      ))}
    </>
  );
};

export default MatchStatusBadge; // Make sure to export the component