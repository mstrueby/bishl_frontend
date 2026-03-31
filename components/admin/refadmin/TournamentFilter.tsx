import React from 'react';
import { TournamentSummary, SummaryCounts } from '../../../types/RefToolValues';
import { tournamentConfigs } from '../../../tools/consts';
import { classNames } from '../../../tools/utils';

interface StatusBarProps {
  counts: SummaryCounts;
}

const StatusBar: React.FC<StatusBarProps> = ({ counts }) => {
  const { totalMatches, fullyAssigned, partiallyAssigned, unassigned } = counts;
  if (totalMatches === 0) return <div className="mt-1.5 h-1 rounded-full bg-gray-200" />;

  const greenPct = (fullyAssigned / totalMatches) * 100;
  const yellowPct = (partiallyAssigned / totalMatches) * 100;
  const redPct = (unassigned / totalMatches) * 100;

  return (
    <div className="mt-1.5 flex h-1 rounded-full overflow-hidden gap-px">
      {fullyAssigned > 0 && (
        <div className="bg-green-500 rounded-full" style={{ width: `${greenPct}%` }} />
      )}
      {partiallyAssigned > 0 && (
        <div className="bg-yellow-400 rounded-full" style={{ width: `${yellowPct}%` }} />
      )}
      {unassigned > 0 && (
        <div className="bg-red-400 rounded-full" style={{ width: `${redPct}%` }} />
      )}
    </div>
  );
};

interface TournamentFilterProps {
  summaries: TournamentSummary[];
  activeTournaments: Set<string>;
  onToggle: (alias: string) => void;
}

const TournamentFilter: React.FC<TournamentFilterProps> = ({ summaries, activeTournaments, onToggle }) => {
  if (summaries.length === 0) return null;

  const sorted = [...summaries].sort((a, b) => {
    const sortA = tournamentConfigs[a.tournamentAlias]?.sortOrder ?? 9999;
    const sortB = tournamentConfigs[b.tournamentAlias]?.sortOrder ?? 9999;
    return sortA - sortB;
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      {sorted.map((summary) => {
        const config = tournamentConfigs[summary.tournamentAlias];
        if (!config) return null;

        const isActive = activeTournaments.has(summary.tournamentAlias);
        const totalCount = summary.counts.totalMatches;

        return (
          <button
            key={summary.tournamentAlias}
            onClick={() => onToggle(summary.tournamentAlias)}
            className={classNames(
              'flex-shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                : 'bg-white text-gray-600 ring-gray-300 hover:bg-gray-50'
            )}
          >
            <span className="md:hidden">{config.tinyName}</span>
            <span className="hidden md:inline">{config.name}</span>
            <span>{totalCount}</span>
            <StatusBar counts={summary.counts} />
          </button>
        );
      })}
    </div>
  );
};

export default TournamentFilter;
