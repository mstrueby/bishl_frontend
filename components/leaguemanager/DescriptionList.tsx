import Badge from '../../components/ui/Badge';

interface DataListItem {
  label: string;
  value: string;
}
interface DataListProps {
  items: DataListItem[];
}

export default function DescriptionList({ items }: DataListProps ) {
  return (
    <div className="mt-6 px-4 sm:px-6 lg:px-8">
      <dl className="grid grid-cols-1 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{item.label}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">
              {item.value === 'Ja' || item.value === 'Nein' ? (
                <Badge info={item.value} />
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
                                                