import React, { Fragment, useEffect, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  DocumentIcon,
  PencilSquareIcon,
  ArrowLeftStartOnRectangleIcon,
  HandRaisedIcon,
  RectangleStackIcon,
  BookmarkIcon,
  CalendarIcon,
  Cog8ToothIcon,
  UserGroupIcon,
  StarIcon,
  ListBulletIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const tournamentConfigs = [
  {
    name: "Regionalliga Ost",
    tiny_name: "RLO",
    href: "/tournaments/regionalliga-ost",
    bdg_col_dark: "bg-red-400/10 text-red-400 ring-red-400/20",
    bdg_col_light: "bg-red-50 text-red-700 ring-red-600/10",
  },
  {
    name: "Landesliga",
    tiny_name: "LL",
    href: "/tournaments/landesliga",
    bdg_col_dark: "bg-gray-400/10 text-gray-400 ring-gray-400/20",
    bdg_col_light: "bg-gray-50 text-gray-600 ring-gray-500/10",
  },
  {
    name: "Hobbyliga",
    tiny_name: "HL",
    href: "/tournaments/hobbyliga",
    bdg_col_dark: "bg-stone-200/10 text-stone-400 ring-stone-200/20",
    bdg_col_light: "bg-stone-100 text-stone-600 ring-stone-800/10",
  },
  {
    name: "Juniorenliga",
    tiny_name: "U19",
    href: "/tournaments/juniorenliga",
    bdg_col_dark: "bg-green-500/10 text-green-400 ring-green-500/20",
    bdg_col_light: "bg-green-50 text-green-700 ring-green-600/20",
  },
  {
    name: "Jugendliga",
    tiny_name: "U16",
    href: "/tournaments/jugendliga",
    bdg_col_dark: "bg-blue-400/10 text-blue-400 ring-blue-400/30",
    bdg_col_light: "bg-blue-50 text-blue-700 ring-blue-700/10",
  },
  {
    name: "Jugendliga P",
    tiny_name: "U16-P",
    href: "/tournaments/jugendliga-p",
    bdg_col_dark: "bg-blue-400/10 text-blue-400 ring-blue-400/30",
    bdg_col_light: "bg-blue-50 text-blue-700 ring-blue-700/10",
  },
  {
    name: "Schülerliga",
    tiny_name: "U13",
    href: "/tournaments/schuelerliga",
    bdg_col_dark: "bg-cyan-400/10 text-cyan-400 ring-cyan-400/30",
    bdg_col_light: "bg-cyan-50 text-cyan-700 ring-cyan-700/10",
  },
  {
    name: "Schülerliga LK2",
    tiny_name: "U13-II",
    href: "/tournaments/schuelerliga-lk2",
    bdg_col_dark: "bg-cyan-400/10 text-cyan-400 ring-cyan-400/30",
    bdg_col_light: "bg-cyan-50 text-cyan-700 ring-cyan-700/10",
  },
  {
    name: "Schülerliga P",
    tiny_name: "U13-P",
    href: "/tournaments/schuelerliga-p",
    bdg_col_dark: "bg-cyan-400/10 text-cyan-400 ring-cyan-400/30",
    bdg_col_light: "bg-cyan-50 text-cyan-700 ring-cyan-700/10",
  },
  {
    name: "Bambini",
    tiny_name: "U10",
    href: "/tournaments/bambini",
    bdg_col_dark: "bg-purple-400/10 text-purple-400 ring-purple-400/30",
    bdg_col_light: "bg-purple-50 text-purple-700 ring-purple-700/10",
  },
  {
    name: "Bambini LK2",
    tiny_name: "U10-II",
    href: "/tournaments/bambini-lk2",
    bdg_col_dark: "bg-purple-400/10 text-purple-400 ring-purple-400/30",
    bdg_col_light: "bg-purple-50 text-purple-700 ring-purple-700/10",
  },
  {
    name: "Mini",
    tiny_name: "U8",
    href: "/tournaments/mini",
    bdg_col_dark: "bg-pink-400/10 text-pink-400 ring-pink-400/20",
    bdg_col_light: "bg-pink-50 text-pink-700 ring-pink-700/10",
  },
  {
    name: "Tag der Meister",
    tiny_name: "TDM",
    href: "/tournaments/tag-der-meister",
    bdg_col_dark: "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20",
    bdg_col_light: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  },
];

const men = tournamentConfigs.filter((config: { name: string }) =>
  ["Regionalliga Ost", "Landesliga", "Hobbyliga"].includes(config.name),
);

const youth = tournamentConfigs.filter((config: { name: string }) =>
  [
    "Juniorenliga",
    "Jugendliga",
    "Jugendliga P",
    "Schülerliga",
    "Schülerliga LK2",
    "Bambini",
    "Bambini LK2",
    "Mini",
  ].includes(config.name),
);

const item =
  "rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white";
const itemActive =
  "inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900";

// Modern MenuItem Link component for Next.js 13+
interface MenuItemLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const MenuItemLink = React.forwardRef<HTMLAnchorElement, MenuItemLinkProps>(
  ({ href, children, className }, ref) => (
    <Link href={href} className={className} ref={ref}>
      {children}
    </Link>
  )
);

MenuItemLink.displayName = 'MenuItemLink';

const Header = () => {
  const { user, setUser, authError, setAuthError, loading, setLoading } =
    useAuth();
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = await fetch("/api/user", {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (userData.ok) {
          const user = await userData.json();
          setUser(user);
        } else {
          // Token might be expired, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        setAuthError(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [setLoading, setUser, setAuthError]);

  return (
    <Disclosure as="nav" className="bg-gray-800 sticky top-0 z-50 shadow-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Navigation (tablet, desktop) */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center">
                  <Link href="/" className="hover:cursor-pointer flex justify-center items-center">
                    <Image
                      src="https://res.cloudinary.com/dajtykxvp/image/upload/v1730372755/logos/bishl_logo.svg"
                      alt="Logo"
                      width={48}
                      height={48}
                      className="block h-8 w-auto flex flex-row items-center justify-center"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    <Link href="/calendar" className={item}>
                      Kalender
                    </Link>
                    <Link href="/tournaments/tag-der-meister" className={item}>
                      Tag der Meister
                    </Link>
                    <Menu as="div" className="relative inline-block text-left">
                      <MenuButton className={item}>Herren</MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-300"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-300"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute left-0 z-60 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {men.map((item, index) => (
                            <MenuItem key={index}>
                              {({ active }) => (
                                <MenuItemLink
                                  href={item.href}
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "block px-4 py-2 text-sm font-medium text-gray-600 hover:no-underline hover:text-gray-900",
                                  )}
                                >
                                  <span
                                    className={classNames(
                                      "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-14",
                                      item.bdg_col_light,
                                    )}
                                  >
                                    {item.tiny_name}
                                  </span>
                                  {item.name}
                                </MenuItemLink>
                              )}
                            </MenuItem>
                          ))}
                        </MenuItems>
                      </Transition>
                    </Menu>
                    <Menu as="div" className="relative inline-block text-left">
                      <MenuButton className={item}>Nachwuchs</MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute left-0 z-60 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {youth.map((item, index) => (
                            <MenuItem key={index}>
                              {({ active }) => (
                                <MenuItemLink
                                  href={item.href}
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "block px-4 py-2 text-sm font-medium text-gray-600 hover:no-underline hover:text-gray-900",
                                  )}
                                >
                                  <span
                                    className={classNames(
                                      "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-14",
                                      item.bdg_col_light,
                                    )}
                                  >
                                    {item.tiny_name}
                                  </span>
                                  {item.name}
                                </MenuItemLink>
                              )}
                            </MenuItem>
                          ))}
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>

              {/* Search, Notification, Profile menu */}
              <div className="flex items-center block">
                <div>
                  {loading ? <span>Loading...</span> : ""}
                  {user !== null ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <MenuButton className="relative flex rounded-full text-gray-400 bg-gray-800 text-sm p-2 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <UserIcon
                            className="block h-6 w-6"
                            aria-hidden="true"
                          />
                        </MenuButton>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 z-60 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <p className="block px-4 py-2 text-sm font-bold text-gray-900 border-b border-gray-200">
                            Hallo {user.firstName}
                          </p>

                          {/* Admin items - only for admins */}
                          {(user.roles?.includes("AUTHOR") ||
                            user.roles?.includes("ADMIN")) && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/posts"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  <PencilSquareIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Beiträge</span>
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}
                          {(user.roles?.includes("DOC_ADMIN") ||
                            user.roles?.includes("ADMIN")) && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/documents"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  <DocumentIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Dokumente</span>
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}

                          {/* Referee admin items - only for referee admins */}
                          {(user.roles?.includes("REF_ADMIN") ||
                            user.roles?.includes("ADMIN")) && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/refadmin/referees"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  <ListBulletIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Schiedsrichter</span>
                                </MenuItemLink>
                              </MenuItem>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/refadmin"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  <CalendarIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Schiris einteilen</span>
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}

                          {/* Referee items - only for referees */}
                          {user.roles?.includes("REFEREE") && (
                            <MenuItem>
                              <MenuItemLink
                                href="/admin/myref"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                              >
                                <HandRaisedIcon
                                  className="mr-3 h-5 w-5 text-gray-500"
                                  aria-hidden="true"
                                />
                                <span>Meine Einsätze</span>
                              </MenuItemLink>
                            </MenuItem>
                          )}

                          {/* My Club administration */}
                          {(user.roles?.includes("CLUB_ADMIN") ||
                            user.roles?.includes("ADMIN")) && (
                            <MenuItem>
                              <MenuItemLink
                                href="/admin/myclub"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                              >
                                <StarIcon
                                  className="mr-3 h-5 w-5 text-gray-500"
                                  aria-hidden="true"
                                />
                                <span>Mein Verein</span>
                              </MenuItemLink>
                            </MenuItem>
                          )}
                          {/* LEAGUE_ADMIN items */}
                          {(user.roles?.includes("LEAGUE_ADMIN") ||
                            user.roles?.includes("ADMIN")) && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/clubs"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center border-t border-gray-200"
                                >
                                  <BookmarkIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Vereine</span>
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}
                          {/* PLAYER_ADMIN items */}
                          {(user.roles?.includes("PLAYER_ADMIN") ||
                            user.roles?.includes("ADMIN")) && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/players"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  <UserGroupIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Spieler</span>
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}
                          {/* ADMIN items - only for admins */}
                          {user.roles?.includes("ADMIN") && (
                            <>
                              <MenuItem>
                                <MenuItemLink
                                  href="/admin/venues"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center border-t border-gray-200"
                                >
                                  <RectangleStackIcon
                                    className="mr-3 h-5 w-5 text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span>Spielflächen</span>
                                </MenuItemLink>
                              </MenuItem>
                              <MenuItem>
                                <MenuItemLink
                                  href="/leaguemanager"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                                >
                                  Spielbetrieb
                                </MenuItemLink>
                              </MenuItem>
                            </>
                          )}

                          {/* Profile - visible to all */}
                          <MenuItem>
                            <MenuItemLink
                              href="/admin/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center border-t border-gray-200"
                            >
                              <Cog8ToothIcon
                                className="mr-3 h-5 w-5 text-gray-500"
                                aria-hidden="true"
                              />
                              <span>Mein Profil</span>
                            </MenuItemLink>
                          </MenuItem>

                          {/* Logout - visible to all */}
                          <MenuItem>
                            <MenuItemLink
                              href="/logout"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:no-underline flex items-center"
                            >
                              <ArrowLeftStartOnRectangleIcon
                                className="mr-3 h-5 w-5 text-gray-500"
                                aria-hidden="true"
                              />
                              <span>Abmelden</span>
                            </MenuItemLink>
                          </MenuItem>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  ) : (
                    /* Login Menu Link */
                    <Link
                      href="/login"
                      className={classNames(
                        "border-2 border-gray-100 hover:no-underline",
                        item,
                      )}
                    >
                      Anmelden
                    </Link>
                  )}
                </div>

                {/* Mobile menu */}
                <div className="-mr-2 ml-3 flex sm:hidden items-center">
                  {/* Mobile menu button */}
                  <DisclosureButton className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </DisclosureButton>
                </div>
              </div>
            </div>
          </div>

          {/* mobile navigation */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <DisclosurePanel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                <DisclosureButton
                  as={Link}
                  href="/calendar"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:no-underline"
                >
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium mr-5 w-16 text-gray-300">
                    <CalendarDaysIcon
                      className="h-5 w-5 text-gray-300"
                      aria-hidden="true"
                    />
                  </span>
                  Kalender
                </DisclosureButton>
                {tournamentConfigs
                  .filter((config) => config.name === "Tag der Meister")
                  .map((item) => (
                    <DisclosureButton
                      as={Link}
                      key="tdm"
                      href="/tournaments/tag-der-meister"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:no-underline"
                    >
                      <span
                        key={item.name}
                        className={classNames(
                          "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-16",
                          item.bdg_col_dark,
                        )}
                      >
                        {item.tiny_name}
                      </span>
                      {item.name}
                    </DisclosureButton>
                  ))}

                {men.map((item, index) => (
                  <DisclosureButton
                    as={Link}
                    key={index}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:no-underline"
                  >
                    <span
                      className={classNames(
                        "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-16",
                        item.bdg_col_dark,
                      )}
                    >
                      {item.tiny_name}
                    </span>
                    {item.name}
                  </DisclosureButton>
                ))}

                {youth.map((item, index) => (
                  <DisclosureButton
                    as={Link}
                    key={index}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white hover:no-underline"
                  >
                    <span
                      className={classNames(
                        "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mr-5 w-16",
                        item.bdg_col_dark,
                      )}
                    >
                      {item.tiny_name}
                    </span>
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

Header.displayName = "Header";

export default Header;