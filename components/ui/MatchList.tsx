
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

  // Helper to get the start of a week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper to get the end of a week (Sunday)
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  // Helper to categorize matches by time periods
  const categorizeByTimePeriods = (matchList: MatchValues[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Current week: Monday to Sunday
    const currentWeekStart = getWeekStart(today);
    const currentWeekEnd = getWeekEnd(today);
    
    // Last week
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(currentWeekStart.getDate() - 1);
    const lastWeekStart = getWeekStart(lastWeekEnd);
    
    // Next week
    const nextWeekStart = new Date(currentWeekEnd);
    nextWeekStart.setDate(currentWeekEnd.getDate() + 1);
    const nextWeekEnd = getWeekEnd(nextWeekStart);

    const past = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay < lastWeekStart;
    });

    const lastWeek = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay >= lastWeekStart && matchDay <= lastWeekEnd;
    });

    const currentWeek = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay >= currentWeekStart && matchDay <= currentWeekEnd;
    });

    const todayMatches = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay.getTime() === today.getTime();
    });

    const nextWeek = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay >= nextWeekStart && matchDay <= nextWeekEnd;
    });

    const upcoming = matchList.filter((match) => {
      const matchDate = new Date(match.startDate);
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDay > nextWeekEnd;
    });

    return { past, lastWeek, currentWeek, today: todayMatches, nextWeek, upcoming };
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

  // SEASON and ROUND modes - tabs by time periods
  if (mode === 'SEASON' || mode === 'ROUND') {
    const { past, lastWeek, currentWeek, today, nextWeek, upcoming } = categorizeByTimePeriods(matches);

    const allTabs = [
      { key: 'past', label: 'Vergangene', matches: past },
      { key: 'lastWeek', label: 'Letzte Woche', matches: lastWeek },
      { key: 'currentWeek', label: 'Aktuelle Woche', matches: currentWeek },
      { key: 'today', label: 'Heute', matches: today },
      { key: 'nextWeek', label: 'Nächste Woche', matches: nextWeek },
      { key: 'upcoming', label: 'Kommende', matches: upcoming },
    ];

    // Filter tabs that have matches
    const tabs = allTabs.filter((tab) => tab.matches.length > 0);

    // Default tab selection order: Heute -> Aktuelle Woche -> Nächste Woche -> Kommende -> Letzte Woche -> Vergangene
    const defaultTabOrder = ['today', 'currentWeek', 'nextWeek', 'upcoming', 'lastWeek', 'past'];
    const defaultTab = defaultTabOrder.find(key => tabs.some(tab => tab.key === key)) || tabs[0]?.key || 'today';
    
    if (!activeTab && tabs.length > 0) {
      setActiveTab(defaultTab);
    }

    const currentTab = activeTab || defaultTab;
    const activeMatches = tabs.find((tab) => tab.key === currentTab)?.matches || [];

    // Check if we have multiple matchdays
    const hasMultipleMatchdays = matchdays.length > 1 && mode === 'ROUND';

    return (
      <>
        {tabs.length > 1 && (
          <div className="border-b border-gray-200 mb-6">
            {/* Mobile: Scrollable nav without scrollbar */}
            <nav 
              aria-label="Tabs" 
              className="sm:hidden -mb-px flex space-x-8 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={classNames(
                    currentTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium'
                  )}
                >
                  {tab.label}
                  <span
                    className={classNames(
                      currentTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                      'ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium'
                    )}
                  >
                    {tab.matches.length}
                  </span>
                </button>
              ))}
            </nav>

            {/* Desktop: Regular nav */}
            <nav aria-label="Tabs" className="hidden sm:flex -mb-px space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={currentTab === tab.key ? 'page' : undefined}
                  className={classNames(
                    currentTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium'
                  )}
                >
                  {tab.label}
                  <span
                    className={classNames(
                      currentTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                      'ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block'
                    )}
                  >
                    {tab.matches.length}
                  </span>
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
