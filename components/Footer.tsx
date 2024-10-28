import Link from 'next/link'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const navigation = {
  bishl: [
    { name: 'Vereine', href: '#' },
    { name: 'Spielflächen', href: '/venues' },
    { name: 'Schiedsrichterwesen', href: '#' },
    { name: 'Dokumente', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
  ],
  associations: [
    { name: 'DRIV', href: 'https://www.driv.de/' },
    { name: 'ISHD', href: 'https://www.ishd.de/' },
    { name: 'IRVB', href: 'https://irvb.org/' },
    { name: 'IISHF', href: 'https://www.iishf.com/' },
  ],
  legal: [
    { name: 'Impressum', href: '/impressum' },
    { name: 'Datenschutz', href: '/datenschutz' },
  ],
}

const Footer = () => {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/">
              <a>
                <img
                  className="h-12 xl:h-32"
                  src="https://res.cloudinary.com/dajtykxvp/image/upload/v1701640413/logos/bishl_logo.png"
                  alt="BISHL"
                />
              </a>
            </Link>
            {/*
            <p className="text-balance text-sm/6 text-gray-300">
              Making the world a better place through constructing elegant hierarchies.
            </p>
            */}
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-white">BISHL</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.bishl.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href}>
                        <a className="text-sm/6 text-gray-400 hover:text-white">
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href}>
                        <a className="text-sm/6 text-gray-400 hover:text-white">
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-white">Verbände</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.associations.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} target="_blank" className="text-sm/6 text-gray-400 hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-white">Rechtliches</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href}>
                        <a className="text-sm/6 text-gray-400 hover:text-white">
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-sm/6 text-gray-400">&copy; {new Date().getFullYear()} BISHL - Berliner Inline-Skater-Hockey-Liga</p>
        </div>
      </div>
    </footer>
  )
};

export default Footer;