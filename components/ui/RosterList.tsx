import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RosterPlayer } from '../../types/MatchValues';
import { 
  ArrowUpIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { ClipLoader } from 'react-spinners';
import { getLicenceTypeBadgeClass, getSourceBadgeClass, passNoBadgeClass, invalidReasonCodeMap } from '../../lib/constants';

interface RosterListProps {
  teamName: string;
  roster: RosterPlayer[];
  rosterStatus?: "VALID" | "INVALID" | "UNKNOWN" | "DRAFT" | "SUBMITTED" | string;
  showEditButton?: boolean;
  editUrl?: string;
  sortRoster?: (roster: RosterPlayer[]) => RosterPlayer[];
  playerStats?: {[playerId: string]: number};
  teamLogoUrl?: string;
  eligibilityTimestamp?: string | Date | null;
  canValidateRoster?: boolean;
  onValidateRoster?: () => Promise<void>;
  onOpenPlayerCard?: (ctx: { playerId: string; teamFlag: "home" | "away"; player: RosterPlayer }) => void;
  teamFlag?: "home" | "away";
  isValidating?: boolean;
  teamId?: string;
}

const positionTooltips: Record<string, string> = {
  'C': 'Captain',
  'A': 'Assistant',
  'G': 'Goalie',
  'F': 'Feldspieler'
};

const eligibilityTooltips: Record<string, string> = {
  'UNKNOWN': 'Spielberechtigung unbekannt',
  'VALID': 'Spielberechtigt',
  'INVALID': 'Nicht spielberechtigt'
};


const RosterList: React.FC<RosterListProps> = ({
  teamName,
  roster,
  rosterStatus,
  showEditButton = false,
  editUrl,
  sortRoster,
  playerStats,
  teamLogoUrl,
  eligibilityTimestamp,
  canValidateRoster = false,
  onValidateRoster,
  onOpenPlayerCard,
  teamFlag = "home",
  isValidating = false,
  teamId
}) => {
  const defaultSortRoster = (rosterToSort: RosterPlayer[]): RosterPlayer[] => {
    if (!rosterToSort || rosterToSort.length === 0) return [];

    return [...rosterToSort].sort((a, b) => {
      const positionPriority: Record<string, number> = { 'C': 1, 'A': 2, 'G': 3, 'F': 4 };
      const posA = positionPriority[a.playerPosition.key] || 99;
      const posB = positionPriority[b.playerPosition.key] || 99;

      if (posA !== posB) {
        return posA - posB;
      }

      const jerseyA = a.player.jerseyNumber || 999;
      const jerseyB = b.player.jerseyNumber || 999;
      return jerseyA - jerseyB;
    });
  };

  const sortedRoster = sortRoster ? sortRoster(roster) : defaultSortRoster(roster);

  const formatEligibilityTimestamp = (timestamp: string | Date | null | undefined): string => {
    if (!timestamp) return 'Noch nicht geprüft';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      if (isNaN(date.getTime())) return 'Noch nicht geprüft';
      return `Geprüft am: ${new Intl.DateTimeFormat('de-DE', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      }).format(date)}`;
    } catch {
      return 'Noch nicht geprüft';
    }
  };

  const getStatusBadgeStyles = (status: string | undefined): string => {
    switch (status) {
      case 'VALID':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'INVALID':
        return 'bg-red-50 text-red-700 ring-red-600/10';
      case 'DRAFT':
        return 'bg-gray-50 text-gray-600 ring-gray-500/10';
      case 'SUBMITTED':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-700/10';
      default:
        return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    }
  };

  const getStatusBadgeText = (status: string | undefined): string => {
    switch (status) {
      case 'VALID':
        return 'Gültig';
      case 'INVALID':
        return 'Ungültig';
      case 'DRAFT':
        return 'Entwurf';
      case 'SUBMITTED':
        return 'Eingereicht';
      default:
        return 'Unbekannt';
    }
  };

  const renderEligibilityIcon = (player: RosterPlayer) => {
    if (isValidating) {
      return <ClipLoader size={14} color="#6B7280" />;
    }

    const status = player.eligibilityStatus || 'UNKNOWN';
    const reasonCodes = player.invalidReasonCodes || [];
    const invalidTitle = reasonCodes.length > 0
      ? `${eligibilityTooltips['INVALID']}: ${reasonCodes.join(', ')}`
      : eligibilityTooltips['INVALID'];
    
    switch (status) {
      case 'VALID':
        return (
          <CheckCircleIcon 
            className="h-5 w-5 text-green-500" 
            title={eligibilityTooltips['VALID']}
          />
        );
      case 'INVALID':
        return (
          <XCircleIcon 
            className="h-5 w-5 text-red-500" 
            title={invalidTitle}
          />
        );
      default:
        return (
          <QuestionMarkCircleIcon 
            className="h-5 w-5 text-gray-400" 
            title={eligibilityTooltips['UNKNOWN']}
          />
        );
    }
  };

  const renderPositionBadge = (positionKey: string) => {
    switch (positionKey) {
      case 'C':
        return (
          <span 
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-600 text-white"
            title={positionTooltips[positionKey] || positionKey}
          >
            {positionKey}
          </span>
        );
      case 'A':
        return (
          <span 
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-400 text-white"
            title={positionTooltips[positionKey] || positionKey}
          >
            {positionKey}
          </span>
        );
      case 'G':
        return (
          <span 
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-white text-gray-900 border border-gray-900" 
            title={positionTooltips[positionKey] || positionKey}
          >
            {positionKey}
          </span>
        );
      default:
        return (
          <span 
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-900"
            title={positionTooltips[positionKey] || positionKey}
          >
            {positionKey}
          </span>
        );
    }
  };

  const getPlayerInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handlePlayerClick = (player: RosterPlayer) => {
    if (onOpenPlayerCard) {
      onOpenPlayerCard({ 
        playerId: player.player.playerId, 
        teamFlag, 
        player 
      });
    }
  };

  const getLicenceType = (player: RosterPlayer): string => {
    if (player.licenseType) {
      return player.licenseType;
    }
    return '-';
  };

  const getLicenceSource = (player: RosterPlayer): string | null => {
    if (player.source) {
      return player.source;
    }
    return null;
  };

  const getPlayerStats = (player: RosterPlayer) => {
    return {
      goals: player.matchStats?.goals ?? player.goals ?? 0,
      assists: player.matchStats?.assists ?? player.assists ?? 0,
      points: player.matchStats?.points ?? player.points ?? 0,
      penaltyMinutes: player.matchStats?.penaltyMinutes ?? player.penaltyMinutes ?? 0
    };
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b mb-3 border-gray-200 pb-3 mt-3 sm:mt-0 sm:mx-3">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Logo + Team info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {teamLogoUrl && (
              <div className="flex-shrink-0">
                <Image
                  src={teamLogoUrl}
                  alt={teamName}
                  width={40}
                  height={40}
                  className="rounded-md object-contain"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-md font-semibold text-gray-900 truncate">{teamName}</h3>
                {rosterStatus && (
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeStyles(rosterStatus)}`}>
                    {getStatusBadgeText(rosterStatus)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                {isValidating ? (
                  <>
                    <ClipLoader size={10} color="#6B7280" />
                    <span>Prüfe...</span>
                  </>
                ) : (
                  formatEligibilityTimestamp(eligibilityTimestamp)
                )}
              </p>
            </div>
          </div>

          {/* Right side: Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canValidateRoster && onValidateRoster && (
              <button
                type="button"
                onClick={onValidateRoster}
                disabled={isValidating}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <span className="flex items-center gap-1.5">
                    <ClipLoader size={12} color="#4B5563" />
                    Prüfen...
                  </span>
                ) : (
                  'Prüfen'
                )}
              </button>
            )}
            {showEditButton && editUrl && (
              <Link 
                href={editUrl} 
                className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Bearbeiten
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-md border">
        {rosterStatus !== 'DRAFT' && sortedRoster && sortedRoster.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">NR.</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-14">POS.</th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50x]">SPIELER</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">TYP</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">QUELLE</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">PASS-NR.</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">HOCH</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10 border-l border-gray-200">T</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10 border-l border-gray-200">V</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10 border-l border-gray-200">P</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10 border-l border-gray-200">SM</th>
                <th scope="col" className="px-2 py-2 w-8 border-l border-gray-200"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-900 text-sm">
              {sortedRoster.map((player) => {
                const stats = getPlayerStats(player);
                const licenceSource = getLicenceSource(player);
                
                return (
                  <tr key={player.player.playerId} className="h-11 hover:bg-gray-50">
                    {/* Eligibility Status */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {renderEligibilityIcon(player)}
                    </td>

                    {/* Jersey Number */}
                    <td className="px-2 py-2 whitespace-nowrap text-center font-medium">
                      {player.player.jerseyNumber ?? '–'}
                    </td>

                    {/* Position */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {renderPositionBadge(player.playerPosition.key)}
                    </td>

                    {/* Player Name with Avatar */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(player)}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          disabled={!onOpenPlayerCard}
                        >
                          {player.player.imageUrl ? (
                            <Image
                              src={player.player.imageUrl}
                              alt={`${player.player.firstName} ${player.player.lastName}`}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                              {getPlayerInitials(player.player.firstName, player.player.lastName)}
                            </span>
                          )}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={() => handlePlayerClick(player)}
                            className="text-left font-medium hover:text-indigo-600 truncate transition-colors"
                            disabled={!onOpenPlayerCard}
                          >
                            {player.player.firstName} {player.player.lastName}
                          </button>
                          {player.invalidReasonCodes && player.invalidReasonCodes.length > 0 && (
                            <div className="text-[10px] text-red-800 font-medium leading-tight truncate">
                              {player.invalidReasonCodes
                                .map((code) => invalidReasonCodeMap[code] || code)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Licence Type */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={getLicenceTypeBadgeClass(player.licenseType)}>
                        {getLicenceType(player)}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {licenceSource && (
                        <span className={getSourceBadgeClass(licenceSource)}>
                          {licenceSource}
                        </span>
                      )}
                    </td>

                    {/* Pass Number */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={passNoBadgeClass}>
                        {player.passNumber}
                      </span>
                    </td>

                    {/* Called/HOCH */}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {player.called ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <ArrowUpIcon className="h-3 w-3 text-gray-600 flex-shrink-0" aria-hidden="true" />
                          {player.calledFromTeam?.teamName && (
                            <span className="text-xs text-gray-700 truncate max-w-[60px]">
                              {player.calledFromTeam.teamName}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            playerStats && playerStats[player.player.playerId] !== undefined && playerStats[player.player.playerId] <= 3
                              ? 'bg-green-50 text-green-800 ring-green-600/20'
                              : playerStats && playerStats[player.player.playerId] === 4
                              ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                              : 'bg-red-50 text-red-600 ring-red-500/20'
                          }`}>
                            {playerStats && playerStats[player.player.playerId] !== undefined
                              ? playerStats[player.player.playerId]
                              : '–'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>

                    {/* Goals */}
                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 border-l border-gray-200">
                      {stats.goals}
                    </td>

                    {/* Assists */}
                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 border-l border-gray-200">
                      {stats.assists}
                    </td>

                    {/* Points */}
                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 border-l border-gray-200">
                      {stats.points}
                    </td>

                    {/* Penalty Minutes */}
                    <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 border-l border-gray-200">
                      {stats.penaltyMinutes}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2 whitespace-nowrap border-l border-gray-200">
                      {onOpenPlayerCard && (
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(player)}
                          className="text-gray-400 hover:text-indigo-600"
                          title="Spielerkarte anzeigen"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Player Count Summary */}
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={14} className="px-3 py-3">
                  <div className="flex justify-between text-sm text-gray-900">
                    <span>
                      Feldspieler: <span className="font-medium">{sortedRoster.filter(player => player.playerPosition.key !== 'G').length}</span>
                    </span>
                    <span>
                      Goalies: <span className="font-medium">{sortedRoster.filter(player => player.playerPosition.key === 'G').length}</span>
                    </span>
                    <span>
                      Gesamt: <span className="font-medium">{sortedRoster.length}</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="text-center py-5 text-sm text-gray-500">
            {rosterStatus === 'DRAFT' ? 'Aufstellung nicht veröffentlicht' : 'Keine Spieler eingetragen'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterList;
