const Badge = ({ info }: { info: string }) => {
  let color: string = '';

  switch (info) {
    case 'aktiv':
      color = 'green';
      break;
    case 'inaktiv':
      color = 'red';
      break;
    case 'extern':
      color = 'gray'
      break;
    default:
      return (
        <span>&nbsp;</span>
      )
  }

  return (
    <span className={`inline-flex items-center rounded-md bg-${color}-50 px-2 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600/20`}>
      {info}
    </span>
  )
}

export default Badge;
