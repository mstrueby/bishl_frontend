import { MatchSettings } from '../types/TournamentValues';
import { ScoresBase } from '../types/MatchValues';

export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

export function getPeriodLabel(totalSeconds: number, settings: MatchSettings): string {
  const periodNames: Record<number, string> = { 2: 'Halbzeit', 3: 'Drittel', 4: 'Viertel' };
  const periodName = periodNames[settings.numOfPeriods] || 'Periode';
  const regulationEndSeconds = settings.numOfPeriods * settings.periodLengthMin * 60;
  if (totalSeconds < regulationEndSeconds) {
    const periodIndex = Math.floor(totalSeconds / (settings.periodLengthMin * 60)) + 1;
    return `${periodIndex}. ${periodName}`;
  }
  if (settings.numOfPeriodsOvertime <= 1 || settings.periodLengthMinOvertime === 0) {
    return 'Verlängerung';
  }
  const overtimeSeconds = totalSeconds - regulationEndSeconds;
  const overtimePeriod = Math.floor(overtimeSeconds / (settings.periodLengthMinOvertime * 60)) + 1;
  return `${overtimePeriod}. Verlängerung`;
}

export function groupByPeriod<T>(
  items: T[],
  getTimeStr: (item: T) => string,
  settings: MatchSettings
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = getPeriodLabel(timeToSeconds(getTimeStr(item)), settings);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

export interface PeriodScore {
  label: string;
  homeGoals: number;
  awayGoals: number;
}

export function getPeriodScores(
  homeScores: ScoresBase[],
  awayScores: ScoresBase[],
  settings: MatchSettings
): PeriodScore[] {
  const allGoals = [
    ...(homeScores || []).map(g => ({ ...g, teamFlag: 'home' as const })),
    ...(awayScores || []).map(g => ({ ...g, teamFlag: 'away' as const })),
  ].sort((a, b) => timeToSeconds(a.matchTime) - timeToSeconds(b.matchTime));

  const groups = groupByPeriod(allGoals, g => g.matchTime, settings);

  // Initialize with regulation periods
  const periodNames: Record<number, string> = { 2: 'Halbzeit', 3: 'Drittel', 4: 'Viertel' };
  const periodName = periodNames[settings.numOfPeriods] || 'Periode';
  
  const result: PeriodScore[] = [];
  for (let i = 1; i <= settings.numOfPeriods; i++) {
    const label = `${i}. ${periodName}`;
    const group = groups.find(g => g.label === label);
    if (group) {
      result.push({
        label: group.label,
        homeGoals: group.items.filter(g => g.teamFlag === 'home').length,
        awayGoals: group.items.filter(g => g.teamFlag === 'away').length,
      });
    } else {
      result.push({ label, homeGoals: 0, awayGoals: 0 });
    }
  }

  // Add any additional periods (overtime, shootout) that have goals
  for (const group of groups) {
    if (!result.some(r => r.label === group.label)) {
      result.push({
        label: group.label,
        homeGoals: group.items.filter(g => g.teamFlag === 'home').length,
        awayGoals: group.items.filter(g => g.teamFlag === 'away').length,
      });
    }
  }

  return result;
}
