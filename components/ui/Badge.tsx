const Badge = ({ info }: { info: string }) => {
  let color: string = '';

  switch (info) {
    case 'aktiv':
    case 'veröffentlicht':
    case 'Ja':
    case 'erforderlich':
      return (
        <span className={`inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20`}>
          {info}
        </span>
      )
    case 'inaktiv':
    case 'nicht veröffentlicht':
    case 'Nein':
      return (
        <span className={`inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20`}>
          {info}
        </span>
      )
    case 'BISHL':
      return (
        <span className={`inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20`}>
          {info}
        </span>
      )
    case 'extern':
    case 'nicht erforderlich':
    case 'ISHD':
      return (
        <span className={`inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20`}>
          {info}
        </span>
      )
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20`}>
          {info}
        </span>
      )
  }


}

export default Badge;
