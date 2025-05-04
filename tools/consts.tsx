export interface AgeGroupRule {
  key: string;
  value: string;
  sortOrder: number;
  altKey: string;
  canAlsoPlayIn?: string[];
  canPlayOverAgeIn?: string[];
  requiresOverAge?: boolean;
  maxOverAgePlayers?: number;
}

{/** ****** S P I E L R E G E L N
4.1 ALTERSGRENZEN
4.1.1 Damen / Herren
Untergrenze: Spieler, die im laufenden Kalenderjahr das 19. Lebensjahr vollenden, sowie ältere
Jahrgänge.
4.1.2 Masters (Damen / Herren)
Untergrenze: Spieler, die im laufenden Kalenderjahr das 45. Lebensjahr vollenden, sowie ältere
Jahrgänge.
4.1.3 Alte Herren (Veteranen (Damen / Herren))
Untergrenze: Spieler, die im laufenden Kalenderjahr das 35. Lebensjahr vollenden, sowie ältere
Jahrgänge.
4.1.4 U-19 (Junioren)
Obergrenze: Spieler, die im laufenden Kalenderjahr das 18. Lebensjahr vollenden.
Untergrenze: Spieler, die im laufenden Kalenderjahr das 16. Lebensjahr vollenden.
4.1.5 U-16 (Jugend)
Obergrenze: Spieler, die im laufenden Kalenderjahr das 15. Lebensjahr vollenden.
Untergrenze: Spieler, die im laufenden Kalenderjahr das 13. Lebensjahr vollenden.
4.1.6 U-13 (Schüler)
Obergrenze: Spieler, die im laufenden Kalenderjahr das 12. Lebensjahr vollenden.
Untergrenze: Spieler, die im laufenden Kalenderjahr das 10. Lebensjahr vollenden.
4.1.7 U-10 (Bambini)
Obergrenze: Spieler, die im laufenden Kalenderjahr das 9. Lebensjahr vollenden.
4.1.8 Alle Spieler der Altersklassen U-19, U-16, U-13 und U-10 dürfen in der nächst höheren Altersklasse
spielen.
Alle weiblichen Spieler dürfen jeweils ein Jahr länger in jeder Altersklasse spielen.
Die vorstehende Regelung für weibliche Spieler gilt in Deutschland ausschließlich für die
Altersklassen U-13, U-16 und U-19. In der Altersklasse U-10 gilt diese Regelung nicht.
Alle weiblichen Spieler der Altersklassen U-16 und U-19 dürfen in der Altersklasse Damen spielen.
Jeder Spieler, der in einer höheren Altersklasse spielt, muss eine entsprechende
Einverständniserklärung seiner Eltern vorweisen. Dem zuständigen nationalen Verband obliegt die
Pflicht, diese elterliche Einverständniserklärung einzuholen.


** ********* BISHL N A C H W U C H S
In Abweichung von §4.1.6 der gültigen Spielregeln wird für die Altersklasse U10 (Bambini) die Alters-Ober-
grenze wie folgt definiert: Spieler, die bis zum 31.08. des laufenden Jahres das 9. Lebensjahr vollenden.“ D.
h, dass Jungs, die nach dem 31.08. des laufenden Jahres ihren 10. Geburtstag feiern in diesem Jahr noch in
der Altersklasse U10 spielberechtigt sind.
In Abweichung von §4.1.7 der gültigen Spielregeln der ISHD dürfen auch in der Altersklasse U10 alle weibli-
chen Spieler ein Jahr länger spielen („Over-Age-Regelung“).
*/}


export const ageGroupConfig: AgeGroupRule[] = [
  {
    key: "HERREN",
    value: "Herren",
    sortOrder: 1,
    altKey: "Herren",
    canAlsoPlayIn: [],
  },
  {
    key: "DAMEN",
    value: "Damen",
    sortOrder: 2,
    altKey: "Damen",
    canAlsoPlayIn: ["HERREN"],
    canPlayOverAgeIn: ["U19"],
  },
  {
    key: "U19",
    value: "U19",
    sortOrder: 3,
    altKey: "Junioren",
    canAlsoPlayIn: ["HERREN"],
    canPlayOverAgeIn: ["U16"],
    maxOverAgePlayers: 3,
  },
  {
    key: "U16",
    value: "U16",
    sortOrder: 4,
    altKey: "Jugend",
    canAlsoPlayIn: ["U19", "DAMEN"],
    canPlayOverAgeIn: ["U13"],
    maxOverAgePlayers: 3,
  },
  {
    key: "U13",
    value: "U13",
    sortOrder: 5,
    altKey: "Schüler",
    canAlsoPlayIn: ["U16"],
    canPlayOverAgeIn: ["U10"],
    maxOverAgePlayers: 3,
  },
  {
    key: "U10",
    value: "U10",
    sortOrder: 6,
    altKey: "Bambini",
    canAlsoPlayIn: ["U13"],
    requiresOverAge: true,
    maxOverAgePlayers: 2,
  },
  {
    key: "U8",
    value: "U8",
    sortOrder: 7,
    altKey: "Mini",
    canAlsoPlayIn: ["U10"],
    maxOverAgePlayers: 2,
  }
];

export const getAgeGroupRules = (ageGroupKey: string): AgeGroupRule | undefined => {
  return ageGroupConfig.find(group => group.key === ageGroupKey);
};

export const canAlsoPlayInAgeGroup = (playerAgeGroup: string, targetAgeGroup: string, overAge: boolean): boolean => {
  if (playerAgeGroup === targetAgeGroup) return true;

  const rules = getAgeGroupRules(playerAgeGroup);
  return (rules?.canAlsoPlayIn?.includes(targetAgeGroup) ||
    (overAge && rules?.canPlayOverAgeIn?.includes(targetAgeGroup))) || false;
};

interface TournamentConfig {
  name: string;
  tinyName: string;
  href: string;
  bdgColDark: string;
  bdgColLight: string;
  matchLenMin: number;
  active: boolean;
  sortOrder: number;
}
export const tournamentConfigs: { [key: string]: TournamentConfig } = {
  'regionalliga-ost': {
    name: 'Regionalliga Ost',
    tinyName: 'RLO',
    href: '/tournaments/regionalliga-ost',
    bdgColDark: 'bg-red-400/10 text-red-400 ring-red-400/20',
    bdgColLight: 'bg-red-50 text-red-700 ring-red-600/10',
    matchLenMin: 125,
    active: true,
    sortOrder: 10,
  },
  'landesliga': {
    name: 'Landesliga',
    tinyName: 'LL',
    href: '/tournaments/landesliga',
    bdgColDark: 'bg-gray-400/10 text-gray-400 ring-gray-400/20',
    bdgColLight: 'bg-gray-50 text-gray-600 ring-gray-500/10',
    matchLenMin: 125,
    active: true,
    sortOrder: 11,
  },
  'hobbyliga': {
    name: 'Hobbyliga',
    tinyName: 'HL',
    href: '/tournaments/hobbyliga',
    bdgColDark: 'bg-stone-200/10 text-stone-400 ring-stone-200/20',
    bdgColLight: 'bg-stone-100 text-stone-600 ring-stone-800/10',
    matchLenMin: 45,
    active: true,
    sortOrder: 12,
  },
  'juniorenliga': {
    name: 'Juniorenliga',
    tinyName: 'U19',
    href: '/tournaments/juniorenliga',
    bdgColDark: 'bg-green-500/10 text-green-400 ring-green-500/20',
    bdgColLight: 'bg-green-50 text-green-700 ring-green-600/20',
    matchLenMin: 50,
    active: true,
    sortOrder: 30,
  },
  'jugendliga': {
    name: 'Jugendliga',
    tinyName: 'U16',
    href: '/tournaments/jugendliga',
    bdgColDark: 'bg-blue-400/10 text-blue-400 ring-blue-400/30',
    bdgColLight: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 40,
  },
  'jugendliga-p': {
    name: 'Jugendliga P',
    tinyName: 'U16-P',
    href: '/tournaments/jugendliga-p',
    bdgColDark: 'bg-blue-400/10 text-blue-400 ring-blue-400/30',
    bdgColLight: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 45,
  },
  'schuelerliga': {
    name: 'Schülerliga',
    tinyName: 'U13',
    href: '/tournaments/schuelerliga',
    bdgColDark: 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/30',
    bdgColLight: 'bg-cyan-400/10 text-cyan-700 ring-cyan-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 50,
  },
  'schuelerliga-lk2': {
    name: 'Schülerliga LK2',
    tinyName: 'U13-II',
    href: '/tournaments/schuelerliga-lk2',
    bdgColDark: 'bg-cyan-400/10 text-cyan-200 ring-cyan-400/30',
    bdgColLight: 'bg-cyan-400/10 text-cyan-700 ring-cyan-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 51,
  },
  'schuelerliga-p': {
    name: 'Schülerliga P',
    tinyName: 'U13-P',
    href: '/tournaments/schuelerliga-p',
    bdgColDark: 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/30',
    bdgColLight: 'bg-cyan-400/10 text-cyan-700 ring-cyan-700/10',
    matchLenMin: 50,
    active: false,
    sortOrder: 55
  },
  'bambini': {
    name: 'Bambini',
    tinyName: 'U10',
    href: '/tournaments/bambini',
    bdgColDark: 'bg-purple-400/10 text-purple-400 ring-purple-400/30',
    bdgColLight: 'bg-purple-50 text-purple-700 ring-purple-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 60,
  },
  'bambini-lk2': {
    name: 'Bambini LK2',
    tinyName: 'U10-II',
    href: '/tournaments/bambini-lk2',
    bdgColDark: 'bg-purple-400/10 text-purple-400 ring-purple-400/30',
    bdgColLight: 'bg-purple-50 text-purple-700 ring-purple-700/10',
    matchLenMin: 50,
    active: true,
    sortOrder: 61
  },
  'mini': {
    name: 'Mini',
    tinyName: 'U8',
    href: '/tournaments/mini',
    bdgColDark: 'bg-pink-400/10 text-pink-400 ring-pink-400/20',
    bdgColLight: 'bg-pink-50 text-pink-700 ring-pink-700/10',
    matchLenMin: 50,
    active: false,
    sortOrder: 70
  }
};

export const getValidTransitions = (currentStatus: string) => {
  switch (currentStatus) {
    case 'AVAILABLE':
      return ['REQUESTED', 'UNAVAILABLE'];
    case 'REQUESTED':
      return ['UNAVAILABLE'];
    case 'ASSIGNED':
      return ['ACCEPTED'];
    case 'ACCEPTED':
      return [];
    case 'UNAVAILABLE':
      return ['REQUESTED'];
    default:
      return ['AVAILABLE'];
  }
}

export const allRefereeAssignmentStatuses = [
  {
    key: 'AVAILABLE', title: 'Verfügbar', current: true, color: {
      divide: 'divide-gray-500/10',
      background: 'bg-gray-50',
      text: 'text-gray-600',
      ring: 'ring-gray-500/10',
      hover: 'hover:bg-gray-100',
      focus: 'focus-visible:outline-gray-500/10',
      dotMyRef: 'fill-gray-400',
      dotRefAdmin: 'fill-gray-400',
    }
  },
  {
    key: 'REQUESTED', title: 'Angefragt', current: false, color: {
      divide: 'divide-yellow-600/20',
      background: 'bg-yellow-50',
      text: 'text-yellow-800',
      ring: 'ring-yellow-600/20',
      hover: 'hover:bg-yellow-100',
      focus: 'focus-visible:outline-yellow-600/20',
      dotMyRef: 'fill-yellow-500',
      dotRefAdmin: 'fill-yellow-500',
    }
  },
  {
    key: 'UNAVAILABLE', title: 'Nicht verfügbar', current: false, color: {
      divide: 'divide-red-600/10',
      background: 'bg-red-50',
      text: 'text-red-700',
      ring: 'ring-red-600/10',
      hover: 'hover:bg-red-100',
      focus: 'focus-visible:outline-red-600/10',
      dotMyRef: 'fill-red-500',
      dotRefAdmin: 'fill-red-500',

    }
  },
  {
    key: 'ASSIGNED', title: 'Eingeteilt', current: false, color: {
      divide: 'divide-green-600/20',
      background: 'bg-green-50',
      text: 'text-green-700',
      ring: 'ring-green-600/20',
      hover: 'hover:bg-green-100',
      focus: 'focus-visible:outline-green-600/20',
      dotMyRef: 'fill-green-500',
      dotRefAdmin: 'fill-green-300',
    }
  },
  {
    key: 'ACCEPTED', title: 'Bestätigt', current: false, color: {
      divide: 'divide-green-100',
      background: 'bg-green-500',
      text: 'text-white',
      ring: 'ring-green-700',
      hover: 'hover:bg-green-100',
      focus: 'focus-visible:outline-green-100',
      dotMyRef: 'fill-green-300',
      dotRefAdmin: 'fill-green-500',
    }
  },
];

// Configuration for referee level colors
export const refereeLevels = {
  SM: {
    caption: 'Schiedsrichter (Mentor)',
    background: 'bg-blue-500',
    text: 'text-white',
    ring: 'ring-blue-600/20',
    dot: 'fill-blue-500'
  },
  S3: {
    caption: 'Schiedsrichter (gut)',
    background: 'bg-green-500',
    text: 'text-white',
    ring: 'ring-green-600/20',
    dot: 'fill-green-500'
  },
  S2: {
    caption: 'Schiedsrichter (mittel)',
    background: 'bg-green-200',
    text: 'text-green-800',
    ring: 'ring-green-600/20',
    dot: 'fill-green-500'
  },
  S1: {
    caption: 'Schiedsrichter (unerfahren)',
    background: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-600/20',
    dot: 'fill-green-500'
  },
  PM: {
    caption: 'Perspektiv-Schiri (Mentor)',
    background: 'bg-orange-500',
    text: 'text-white',
    ring: 'ring-orange-600/20',
    dot: 'fill-orange-500'
  },
  P3: {
    caption: 'Perspektiv-Schiri (gut)',
    background: 'bg-yellow-500',
    text: 'text-white',
    ring: 'ring-yellow-600/20',
    dot: 'fill-yellow-500'
  },
  P2: {
    caption: 'Perspektiv-Schiri (mittel)',
    background: 'bg-yellow-200',
    text: 'text-yellow-700',
    ring: 'ring-yellow-600/20',
    dot: 'fill-yellow-500'
  },
  P1: {
    caption: 'Perspektiv-Schiri (unerfahren)',
    background: 'bg-yellow-50',
    text: 'text-yellow-700',
    ring: 'ring-yellow-600/20',
    dot: 'fill-yellow-500'
  },
  "n/a": {
    caption: 'kein Schiri-Level',
    background: 'bg-gray-50',
    text: 'text-gray-700',
    ring: 'ring-gray-600/20',
    dot: 'fill-gray-400'
  }
};

export const allMatchStatuses = [
  {
    key: "SCHEDULED",
    value: "Angesetzt",
    sortOrder: 1
  },
  {
    key: "INPROGRESS",
    value: "Live",
    sortOrder: 2
  },
  {
    key: "FINISHED",
    value: "Beendet",
    sortOrder: 3
  },
  {
    key: "CANCELLED",
    value: "Abgesagt",
    sortOrder: 4
  },
  {
    key: "FORFEITED",
    value: "Gewertet",
    sortOrder: 5
  }
];

export const allFinishTypes = [
  {
    "key": "REGULAR",
    "value": "Regulär",
    "sortOrder": 1
  },
  {
    "key": "OVERTIME",
    "value": "Verlängerung",
    "sortOrder": 2
  },
  {
    "key": "SHOOTOUT",
    "value": "Penaltyschießen",
    "sortOrder": 3
  }
]