import { RosterPlayer } from '../types/MatchValues';

export interface RosterCheckResult {
  key: string;
  passed: boolean;
  messagePass: string;
  messageFail: string;
}

export interface RosterValidationConfig {
  minSkaterCount: number;
  maxCalledPlayers?: number;
}

export function validateRoster(
  roster: RosterPlayer[],
  config: RosterValidationConfig
): RosterCheckResult[] {
  const { minSkaterCount, maxCalledPlayers = 5 } = config;

  const hasCaptain = roster.some(p => p.playerPosition.key === 'C');
  const hasAssistant = roster.some(p => p.playerPosition.key === 'A');
  const hasGoalie = roster.some(p => p.playerPosition.key === 'G');

  const skaterCount = roster.filter(p => p.playerPosition.key !== 'G').length;
  const hasMinSkaters = skaterCount >= minSkaterCount;

  const hasZeroJersey = roster.some(p => p.player.jerseyNumber === 0);

  const jerseyNumbers = roster.map(p => p.player.jerseyNumber);
  const hasDuplicateJerseys = jerseyNumbers.some(
    (num, index) => jerseyNumbers.indexOf(num) !== index
  );

  const calledCount = roster.filter(p => p.called).length;
  const hasMaxCalled = calledCount <= maxCalledPlayers;

  return [
    {
      key: 'captain',
      passed: hasCaptain,
      messagePass: 'Captain (C) wurde festgelegt',
      messageFail: 'Es wurde noch kein Captain (C) festgelegt',
    },
    {
      key: 'assistant',
      passed: hasAssistant,
      messagePass: 'Assistant (A) wurde festgelegt',
      messageFail: 'Es wurde noch kein Assistant (A) festgelegt',
    },
    {
      key: 'goalie',
      passed: hasGoalie,
      messagePass: 'Mindestens ein Goalie (G) wurde festgelegt',
      messageFail: 'Es wurde noch kein Goalie (G) festgelegt',
    },
    {
      key: 'minSkaters',
      passed: hasMinSkaters,
      messagePass: `Mindestens ${minSkaterCount} Feldspieler wurden festgelegt`,
      messageFail: `Es müssen mindestens ${minSkaterCount} Feldspieler festgelegt werden`,
    },
    {
      key: 'jerseyNumbers',
      passed: !hasZeroJersey,
      messagePass: 'Alle Spieler haben Rückennummern',
      messageFail: 'Es fehlen noch Rückennummern',
    },
    {
      key: 'duplicateJerseys',
      passed: !hasDuplicateJerseys,
      messagePass: 'Keine doppelten Rückennummern',
      messageFail: 'Doppelte Rückennummern vorhanden',
    },
    {
      key: 'calledPlayers',
      passed: hasMaxCalled,
      messagePass: `Hochgemeldete Spieler: ${calledCount} von ${maxCalledPlayers}`,
      messageFail: `Zu viele hochgemeldete Spieler: ${calledCount} von max. ${maxCalledPlayers}`,
    },
  ];
}

export function isRosterComplete(checks: RosterCheckResult[]): boolean {
  return checks.every(c => c.passed);
}
