import { RosterPlayer } from '../types/MatchValues';

export interface RosterCheckResult {
  key: string;
  passed: boolean;
  label: string;
}

export function validateRoster(
  roster: RosterPlayer[],
  options: { minSkaterCount: number }
): RosterCheckResult[] {
  const { minSkaterCount } = options;

  const hasCaptain = roster.some((p) => p.playerPosition.key === 'C');
  const hasAssistant = roster.some((p) => p.playerPosition.key === 'A');
  const hasGoalie = roster.some((p) => p.playerPosition.key === 'G');
  const skaterCount = roster.filter((p) => p.playerPosition.key !== 'G').length;
  const hasMinSkaters = skaterCount >= minSkaterCount;
  const hasZeroJersey = roster.some((p) => p.player.jerseyNumber === 0);
  const jerseyNumbers = roster.map((p) => p.player.jerseyNumber);
  const hasDuplicateJerseys = jerseyNumbers.some(
    (num, i) => jerseyNumbers.indexOf(num) !== i,
  );
  const calledCount = roster.filter((p) => p.called).length;
  const calledWithinLimit = calledCount <= 5;

  return [
    {
      key: 'captain',
      passed: hasCaptain,
      label: hasCaptain
        ? 'Captain (C) wurde festgelegt'
        : 'Es wurde noch kein Captain (C) festgelegt',
    },
    {
      key: 'assistant',
      passed: hasAssistant,
      label: hasAssistant
        ? 'Assistant (A) wurde festgelegt'
        : 'Es wurde noch kein Assistant (A) festgelegt',
    },
    {
      key: 'goalie',
      passed: hasGoalie,
      label: hasGoalie
        ? 'Mindestens ein Goalie (G) wurde festgelegt'
        : 'Es wurde noch kein Goalie (G) festgelegt',
    },
    {
      key: 'minSkaters',
      passed: hasMinSkaters,
      label: hasMinSkaters
        ? `Mindestens ${minSkaterCount} Feldspieler wurden festgelegt`
        : `Es müssen mindestens ${minSkaterCount} Feldspieler festgelegt werden`,
    },
    {
      key: 'jerseyNumbers',
      passed: !hasZeroJersey,
      label: hasZeroJersey
        ? 'Es fehlen noch Rückennummern'
        : 'Alle Spieler haben Rückennummern',
    },
    {
      key: 'duplicateJerseys',
      passed: !hasDuplicateJerseys,
      label: hasDuplicateJerseys
        ? 'Doppelte Rückennummern vorhanden'
        : 'Keine doppelten Rückennummern',
    },
    {
      key: 'calledPlayers',
      passed: calledWithinLimit,
      label: calledWithinLimit
        ? `Hochgemeldete Spieler: ${calledCount} von 5`
        : `Zu viele hochgemeldete Spieler: ${calledCount} von max. 5`,
    },
  ];
}

export function isRosterComplete(checks: RosterCheckResult[]): boolean {
  return checks.every((c) => c.passed);
}
