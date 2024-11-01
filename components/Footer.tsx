import Link from 'next/link'
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

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
          <div className="space-y-8 block xl:hidden">
            <Link href="/">
              <div className="hover:cursor-pointer flex justify-center items-center">
                <Image
                  src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.svg"
                  alt="BISHL"
                  width={64}
                  height={64}
                  layout="fixed"
                />
              </div>
            </Link>  
            <p className="text-balance text-sm/6 text-gray-300 text-center uppercase">
              Berliner Inline-Skater-Hockey-Liga
            </p>
          </div>
          <div className="space-y-8 hidden xl:block pr-12">
            <Link href="/">
              <div className="hover:cursor-pointer flex justify-center items-center">
                <Image
                  src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.svg"
                  alt="BISHL"
                  width={128}
                  height={128}
                  layout="fixed"
                />
              </div>
            </Link>
            <p className="text-balance text-sm/6 text-gray-300 text-center uppercase">
              Berliner Inline-Skater-Hockey-Liga
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-white">BISHL</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.bishl.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href}>
                        <a className="text-sm/6 text-gray-400 hover:text-white hover:no-underline">
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
                        <a className="text-sm/6 text-gray-400 hover:text-white hover:no-underline">
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
                      <a href={item.href} target="_blank" rel="noreferrer noopener nofollow" className="text-sm/6 text-gray-400 hover:text-white hover:no-underline">
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
                        <a className="text-sm/6 text-gray-400 hover:text-white hover:no-underline">
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