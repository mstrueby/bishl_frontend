import Link from 'next/link'
import HeroIcon from './HeroIcon'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}


export default function Sidebar({
  NavData
}: {
  NavData: {
    name: string
    icon: string
    href: string
    current: boolean
  }[]
}) {
  return (
    <aside className="py-6 md:col-span-3">
      <nav className="space-y-1 bg-white" aria-label="Sidebar">
        {NavData.map(({ name, href, icon }) => (

          <Link href={href} key={name}>
            <a className="border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium border-l-4">
              <HeroIcon 
                icon={icon} 
                className='text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6'
                aria-hidden="true"
              />
                {name}
            </a>
          </Link>

        ))}
      </nav>
    </aside>
  )
}

