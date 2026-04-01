import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { RefToolMatch, RefToolMatchList, TournamentSummary } from '../../../types/RefToolValues';
import Layout from '../../../components/Layout';
import SectionHeader from '../../../components/admin/SectionHeader';
import MatchCardRefAdmin from '../../../components/admin/MatchCardRefAdmin';
import MatchDetailDrawer from '../../../components/admin/MatchDetailDrawer';
import MonthNav from '../../../components/admin/refadmin/MonthNav';
import DayStrip from '../../../components/admin/refadmin/DayStrip';
import TournamentFilter from '../../../components/admin/refadmin/TournamentFilter';
import apiClient from '../../../lib/apiClient';
import useAuth from '../../../hooks/useAuth';
import { UserRole } from '../../../lib/auth';
import usePermissions from '../../../hooks/usePermissions';
import LoadingState from '../../../components/ui/LoadingState';
import { classNames } from '../../../tools/utils';
import { MapPinIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const RefAdmin: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const router = useRouter();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    now.toISOString().split('T')[0]
  );
  const [matchListData, setMatchListData] = useState<RefToolMatchList[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [activeTournaments, setActiveTournaments] = useState<Set<string>>(new Set());
  const [groupByVenue, setGroupByVenue] = useState(false);
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<RefToolMatch | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) {
      router.push('/');
    }
  }, [authLoading, user, hasAnyRole, router]);

  const fetchMatches = useCallback(async (date: string, resetFilter = true) => {
    if (resetFilter) setMatchesLoading(true);
    try {
      const res = await apiClient.get('/reftool/matches', {
        params: { start_date: date, end_date: date },
      });
      const data: RefToolMatchList[] = Array.isArray(res.data) ? res.data : [];
      setMatchListData(data);
      if (resetFilter) {
        const allAliases = new Set<string>(
          data.flatMap(d => d.tournamentSummary.map(t => t.tournamentAlias))
        );
        setActiveTournaments(allAliases);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (resetFilter) {
        setMatchListData([]);
        setActiveTournaments(new Set());
      }
    } finally {
      if (resetFilter) setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) return;
    if (selectedDate) {
      fetchMatches(selectedDate);
    }
  }, [authLoading, user, hasAnyRole, selectedDate, fetchMatches]);

  const handlePrevMonth = () => {
    setSelectedDate(null);
    setMatchListData([]);
    setActiveTournaments(new Set());
    if (selectedMonth === 1) {
      setSelectedYear(y => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    setMatchListData([]);
    setActiveTournaments(new Set());
    if (selectedMonth === 12) {
      setSelectedYear(y => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleDaySelect = (date: string) => {
    setSelectedDate(date);
    setActiveTournaments(new Set());
  };

  const handleTournamentToggle = (alias: string) => {
    setActiveTournaments(prev => {
      const next = new Set(prev);
      if (next.has(alias)) {
        next.delete(alias);
      } else {
        next.add(alias);
      }
      return next;
    });
  };

  const handleOpenDetail = (match: RefToolMatch) => {
    setSelectedMatch(match);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleDataChanged = useCallback(() => {
    if (selectedDate) {
      fetchMatches(selectedDate, false);
    }
  }, [selectedDate, fetchMatches]);

  // Sync expandedVenues with current venues whenever groupByVenue or matches change
  useEffect(() => {
    if (!groupByVenue) {
      setExpandedVenues(new Set());
      return;
    }
    const allMatchesNow = matchListData
      .flatMap(d => d.matches)
      .filter(m => activeTournaments.has(m.tournament.alias));
    const venues = Array.from(new Set(allMatchesNow.map(m => m.venue.name)));
    setExpandedVenues(new Set(venues));
  }, [groupByVenue, matchListData, activeTournaments]);

  if (authLoading) {
    return (
      <Layout>
        <SectionHeader title="Schiedsrichter Administration" />
        <LoadingState />
      </Layout>
    );
  }

  if (!hasAnyRole([UserRole.ADMIN, UserRole.REF_ADMIN])) return null;

  const allMatches: RefToolMatch[] = matchListData
    .flatMap(d => d.matches)
    .filter(m => activeTournaments.has(m.tournament.alias))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const tournamentSummaries: TournamentSummary[] = matchListData.flatMap(d => d.tournamentSummary);

  const renderMatchList = () => {
    if (matchesLoading) return <LoadingState />;
    if (!selectedDate) {
      return (
        <p className="text-center text-gray-400 text-sm mt-8">
          Bitte einen Tag auswählen
        </p>
      );
    }
    if (allMatches.length === 0) {
      return (
        <p className="text-center text-gray-400 text-sm mt-8">
          Keine Spiele für diesen Filter gefunden
        </p>
      );
    }

    if (groupByVenue) {
      const byVenue = allMatches.reduce<Record<string, RefToolMatch[]>>((acc, m) => {
        const venueName = m.venue.name;
        if (!acc[venueName]) acc[venueName] = [];
        acc[venueName].push(m);
        return acc;
      }, {});

      const sortedVenues = Object.keys(byVenue).sort((a, b) => a.localeCompare(b));

      return (
        <div className="space-y-6">
          {sortedVenues.map(venueName => {
            const isExpanded = expandedVenues.has(venueName);
            return (
              <div key={venueName}>
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedVenues);
                    if (isExpanded) {
                      newExpanded.delete(venueName);
                    } else {
                      newExpanded.add(venueName);
                    }
                    setExpandedVenues(newExpanded);
                  }}
                  className="flex items-center gap-1.5 w-full px-1 py-2 mb-4 rounded transition-colors border-b border-gray-200"
                >
                  <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-600 hover:text-gray-800 flex-1 text-left">
                    {venueName}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">
                    {byVenue[venueName].length}
                  </span>
                  {isExpanded
                    ? <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  }
                </button>
                {isExpanded && (
                  <div className="space-y-4 mt-2">
                    {byVenue[venueName].map(m => (
                      <MatchCardRefAdmin key={m._id} match={m} onOpenDetail={handleOpenDetail} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allMatches.map(m => (
          <MatchCardRefAdmin key={m._id} match={m} onOpenDetail={handleOpenDetail} />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <SectionHeader title="Schiedsrichter Administration" />

      <div className="space-y-4">
        {/* Month navigation */}
        <MonthNav
          year={selectedYear}
          month={selectedMonth}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />

        {/* Day strip */}
        <DayStrip
          year={selectedYear}
          month={selectedMonth}
          selectedDate={selectedDate}
          onDaySelect={handleDaySelect}
        />

        {/* Divider */}
        {selectedDate && (
          <div className="pt-2 space-y-3">
            {/* Tournament filter */}
            {tournamentSummaries.length > 0 && (
              <TournamentFilter
                summaries={tournamentSummaries}
                activeTournaments={activeTournaments}
                onToggle={handleTournamentToggle}
              />
            )}

            {/* Group by venue toggle */}
            {!matchesLoading && allMatches.length > 0 && (
              <div className="flex justify-start sm:justify-end">
                <button
                  onClick={() => setGroupByVenue(v => !v)}
                  className={classNames(
                    'flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset transition-colors mt-4 sm:mt-0',
                    groupByVenue
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                      : 'bg-white text-gray-600 ring-gray-300 hover:bg-gray-50'
                  )}
                >
                  <MapPinIcon className="h-3.5 w-3.5" />
                  Nach Spielstätte gruppieren
                </button>
              </div>
            )}

            {/* Match list */}
            <div className="mt-2">
              {renderMatchList()}
            </div>
          </div>
        )}

        {!selectedDate && !matchesLoading && (
          <div className="mt-4">
            {renderMatchList()}
          </div>
        )}
      </div>

      {/* Match detail drawer */}
      <MatchDetailDrawer
        match={selectedMatch}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onDataChanged={handleDataChanged}
      />
    </Layout>
  );
};

export default RefAdmin;
