import { useRouter } from 'next/router';
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import Badge from '../../components/ui/Badge';

interface DataListItem {
  name: string;
  imageUrl?: string;
  description?: string;
  published?: boolean;
  href?: string;
}
interface DataListProps {
  items: DataListItem[];
}

export default function DataList({ items }: DataListProps) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.name} className="relative py-5 hover:bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
              <div className="flex min-w-0 gap-x-4">
                {item.imageUrl && (
                  <img className="h-12 w-12 flex-none rounded-full bg-gray-50" src={item.imageUrl} alt="" />
                )}
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {item.href ? (
                      <Link href={item.href}>
                        <a>
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          {item.name}
                        </a>
                      </Link>
                    ) : item.name}
                  </p>
                  {item.description && (
                    <p className="mt-1 flex text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <Badge info={item.published === true ? 'veröffentlicht' : 'nicht veröffentlicht'} />
                </div>
                <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}