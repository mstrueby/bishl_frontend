export const tournamentConfigs = [
  { name: 'Regionalliga Ost', tiny_name: 'RLO', href: '/tournaments/regionalliga-ost', bdg_col_dark: 'bg-red-400/10 text-red-400 ring-red-400/20', bdg_col_light: 'bg-red-50 text-red-700 ring-red-600/10' },
  { name: 'Landesliga', tiny_name: 'LL', href: '/tournaments/landesliga', bdg_col_dark: 'bg-gray-400/10 text-gray-400 ring-gray-400/20', bdg_col_light: 'bg-gray-50 text-gray-600 ring-gray-500/10' },
  { name: 'Juniorenliga', tiny_name: 'U19', href: '/tournaments/juniorenliga', bdg_col_dark: 'bg-green-500/10 text-green-400 ring-green-500/20', bdg_col_light: 'bg-green-50 text-green-700 ring-green-600/20' },
  { name: 'Jugendliga', tiny_name: 'U16', href: '/tournaments/jugendliga', bdg_col_dark: 'bg-blue-400/10 text-blue-400 ring-blue-400/30', bdg_col_light: 'bg-blue-50 text-blue-700 ring-blue-700/10' },
  { name: 'Schülerliga', tiny_name: 'U13', href: '/tournaments/schuelerliga', bdg_col_dark: 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30', bdg_col_light: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' },
  { name: 'Bambini', tiny_name: 'U10', href: '/tournaments/bambini', bdg_col_dark: 'bg-purple-400/10 text-purple-400 ring-purple-400/30', bdg_col_light: 'bg-purple-50 text-purple-700 ring-purple-700/10' },
  { name: 'Mini', tiny_name: 'U8', href: '/tournaments/mini', bdg_col_dark: 'bg-pink-400/10 text-pink-400 ring-pink-400/20', bdg_col_light: 'bg-pink-50 text-pink-700 ring-pink-700/10' },
];

export const allRefereeAssignmentStatuses = [
  {
    key: 'AVAILABLE', title: 'Verfügbar', current: true, color: {
      divide: 'divide-gray-500/10',
      background: 'bg-gray-50',
      text: 'text-gray-600',
      ring: 'ring-gray-500/10',
      hover: 'hover:bg-gray-100',
      focus: 'focus-visible:outline-gray-500/10',
      dot: 'fill-gray-400'
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
      dot: 'fill-yellow-500'
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
      dot: 'fill-red-500'
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
      dot: 'fill-green-500'
    }
  },
  {
    key: 'ACCEPTED', title: 'Bestätigt', current: false, color: {
      divide: 'divide-green-100',
      background: 'bg-green-100',
      text: 'text-green-700',
      ring: 'ring-green-100',
      hover: 'hover:bg-green-100',
      focus: 'focus-visible:outline-green-100',
      dot: 'fill-green-600'
    }
  },
]