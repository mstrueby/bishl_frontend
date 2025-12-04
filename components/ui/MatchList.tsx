
import React, { useState } from 'react';
import { MatchValues } from '../../types/MatchValues';
import { MatchdayValues } from '../../types/TournamentValues';
import MatchCard from './MatchCard';
import { classNames } from '../../tools/utils';

interface MatchListProps {
  matches: MatchValues[];
  matchdays?: MatchdayValues[];
  mode: 'SEASON' | 'ROUND' | 'MATCHDAY';
  from: string;
  onMatchUpdate?: () => Promise<void>;
  matchdayOwner?: {
    clubId: string;
    clubName: string;
    clubAlias: string;
  } | null;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  matchdays = [],
  mode,
  from,
  onMatchUpdate,
  matchdayOwner,
}) => {
  const [activeTab, setActiveTab] = useState<string>('');

  // Helper to categorize matches by time
  const categorizeByTime = (matchList: MatchValues[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const past = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay < today;
    });

    const todayMatches = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay.getTime() === today.getTime();
    });

    const next = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay >= tomorrow;
    });

    return { past, today: todayMatches, next };
  };

  // Helper to group matches by matchday
  const groupByMatchday = (matchList: MatchValues[]) => {
    const grouped: { [key: string]: MatchValues[] } = {};
    
    matchList.forEach((match) => {
      const mdAlias = match.matchday?.alias || 'unknown';
      if (!grouped[mdAlias]) {
        grouped[mdAlias] = [];
      }
      grouped[mdAlias].push(match);
    });

    // Sort by matchday startDate
    const sortedGroups = Object.entries(grouped).sort(([aliasA], [aliasB]) => {
      const mdA = matchdays.find(md => md.alias === aliasA);
      const mdB = matchdays.find(md => md.alias === aliasB);
      
      if (mdA?.startDate && mdB?.startDate) {
        return new Date(mdA.startDate).getTime() - new Date(mdB.startDate).getTime();
      }
      return aliasA.localeCompare(aliasB);
    });

    return sortedGroups;
  };

  // MATCHDAY mode - simple list
  if (mode === 'MATCHDAY') {
    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard
            key={match._id || match.matchId}
            match={match}
            from={from}
            onMatchUpdate={onMatchUpdate}
            matchdayOwner={matchdayOwner}
          />
        ))}
      </div>
    );
  }

  // SEASON mode - tabs by time
  if (mode === 'SEASON') {
    const { past, today, next } = categorizeByTime(matches);

    const tabs = [
      { key: 'past', label: 'Vergangene', matches: past },
      { key: 'today', label: 'Heute', matches: today },
      { key: 'next', label: 'Kommende', matches: next },
    ].filter((tab) => tab.matches.length > 0);

    const defaultTab = today.length > 0 ? 'today' : next.length > 0 ? 'next' : tabs[0]?.key || 'today';
    
    if (!activeTab && tabs.length > 0) {
      setActiveTab(defaultTab);
    }

    const currentTab = activeTab || defaultTab;
    const activeMatches = tabs.find((tab) => tab.key === currentTab)?.matches || [];

    return (
      <>
        {tabs.length > 1 && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={classNames(
                    currentTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                  )}
                >
                  {tab.label} ({tab.matches.length})
                </button>
              ))}
            </nav>
          </div>
        )}

        <div className="space-y-4">
          {activeMatches.map((match) => (
            <MatchCard
              key={match._id || match.matchId}
              match={match}
              from={from}
              onMatchUpdate={onMatchUpdate}
              matchdayOwner={matchdayOwner}
            />
          ))}
        </div>
      </>
    );
  }

  // ROUND mode - tabs by time, grouped by matchday if multiple matchdays
  if (mode === 'ROUND') {
    const { past, today, next } = categorizeByTime(matches);

    const tabs = [
      { key: 'past', label: 'Vergangene', matches: past },
      { key: 'today', label: 'Heute', matches: today },
      { key: 'next', label: 'Kommende', matches: next },
    ].filter((tab) => tab.matches.length > 0);

    const defaultTab = today.length > 0 ? 'today' : next.length > 0 ? 'next' : tabs[0]?.key || 'today';
    
    if (!activeTab && tabs.length > 0) {
      setActiveTab(defaultTab);
    }

    const currentTab = activeTab || defaultTab;
    const activeMatches = tabs.find((tab) => tab.key === currentTab)?.matches || [];

    // Check if we have multiple matchdays
    const hasMultipleMatchdays = matchdays.length > 1;

    return (
      <>
        {tabs.length > 1 && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={classNames(
                    currentTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                  )}
                >
                  {tab.label} ({tab.matches.length})
                </button>
              ))}
            </nav>
          </div>
        )}

        {hasMultipleMatchdays ? (
          <div className="space-y-8">
            {groupByMatchday(activeMatches).map(([mdAlias, mdMatches]) => {
              const matchday = matchdays.find(md => md.alias === mdAlias);
              return (
                <div key={mdAlias}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {matchday?.name || mdAlias}
                  </h3>
                  <div className="space-y-4">
                    {mdMatches.map((match) => (
                      <MatchCard
                        key={match._id || match.matchId}
                        match={match}
                        from={from}
                        onMatchUpdate={onMatchUpdate}
                        matchdayOwner={matchdayOwner}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {activeMatches.map((match) => (
              <MatchCard
                key={match._id || match.matchId}
                match={match}
                from={from}
                onMatchUpdate={onMatchUpdate}
                matchdayOwner={matchdayOwner}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return null;
};

export default MatchList;
