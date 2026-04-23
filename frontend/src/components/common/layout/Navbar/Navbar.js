import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  CreditCardIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CalculatorIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Fragment } from "react";
import Breadcrumbs from "../../Breadcrumbs";
import ThemeToggle from "../../ThemeToggle";

const navigation = [
  { 
    name: "Explore", 
    href: "/explore", 
    icon: GlobeAltIcon,
  },
  { 
    name: "Build", 
    href: "/build", 
    icon: CreditCardIcon,
    auth: true,
  },
  { 
    name: "Back", 
    href: "/back", 
    icon: ChartBarIcon,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const router = useRouter();
  const pathname = router.asPath;
  const { currentUser, logout } = useAuth();

  const githubUsername =
    currentUser?.providerData?.find((p) => p.providerId === "github.com")?.uid ||
    null;

  const GithubIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
      </svg>
    );
  };

  return (
    <div>
      <Disclosure as="nav" className="bg-white shadow-lg border-b border-gray-200">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
              <div className="flex h-14 sm:h-16 justify-between items-center">
                <div className="flex items-center flex-shrink-0">
                  <div className="flex shrink-0 items-center">
                    <a href="/" className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src="/POS.png"
                        alt="Proof Of Ship Logo"
                        width={32}
                        height={32}
                        className="rounded w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <div className="hidden sm:block">
                        <div className="text-base sm:text-lg font-bold text-gray-900">Proof of Ship</div>
                      </div>
                    </a>
                  </div>
                  <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                    {navigation
                      .filter(
                        (item) => !item.auth || (item.auth && currentUser)
                      )
                      .map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            pathname === item.href
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent",
                            "group flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200"
                          )}
                          aria-current={
                            pathname === item.href ? "page" : undefined
                          }
                        >
                          {item.icon && (
                            <item.icon 
                              className={classNames(
                                pathname === item.href
                                  ? "text-blue-600"
                                  : "text-gray-400 group-hover:text-gray-600",
                                "mr-2 h-4 w-4"
                              )}
                            />
                          )}
                          {item.name}
                        </a>
                      ))}
                  </div>
                </div>

                <div className="hidden sm:ml-4 sm:flex sm:items-center gap-2 sm:gap-4">
                  <a
                    href="https://github.com/thisyearnofear/proof-of-ship"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    title="View on GitHub"
                  >
                    <span className="sr-only">View GitHub repository</span>
                    <GithubIcon />
                  </a>

                  {/* Profile dropdown */}
                  {currentUser ? (
                    <Menu as="div" className="relative">
                      <div>
                        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-gray-200 hover:border-blue-300 transition-colors min-w-touch min-h-touch items-center justify-center">
                          <span className="sr-only">Open user menu</span>
                          {currentUser.photoURL ? (
                            <img
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                              src={currentUser.photoURL}
                              alt={currentUser.displayName || "User"}
                            />
                          ) : (
                            <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 p-0.5" />
                          )}
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 sm:w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {currentUser.displayName || 'Developer'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {currentUser.email}
                            </p>
                          </div>

                          {githubUsername && (
                            <Menu.Item>
                              {({ active }) => (
                                <a
                                  href={`/u/${githubUsername}`}
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "flex items-center px-4 py-2 text-sm text-gray-700"
                                  )}
                                >
                                  <GlobeAltIcon className="mr-3 h-4 w-4 text-gray-400" />
                                  My Portfolio
                                </a>
                              )}
                            </Menu.Item>
                          )}

                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="/build"
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "flex items-center px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                <CreditCardIcon className="mr-3 h-4 w-4 text-gray-400" />
                                Credit Dashboard
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="/profile"
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "flex items-center px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                <UserCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                                Your Profile
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="/admin/war-room"
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "flex items-center px-4 py-2 text-sm text-gray-700 font-bold text-orange-600"
                                )}
                              >
                                <ShieldCheckIcon className="mr-3 h-4 w-4 text-orange-500" />
                                Verification War Room
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="/admin/payout-simulation"
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "flex items-center px-4 py-2 text-sm text-gray-700 font-semibold text-blue-600 border-t border-gray-100"
                                )}
                              >
                                <CalculatorIcon className="mr-3 h-4 w-4 text-blue-500" />
                                Payout Simulator
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  logout();
                                }}
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                Sign out
                              </a>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href="/login"
                        className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium"
                      >
                        Sign in
                      </a>
                      <a
                        href="/build"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all min-w-touch min-h-touch flex items-center justify-center"
                      >
                        Get Funded
                      </a>
                    </div>
                  )}
                  <ThemeToggle />
                </div>

                <div className="flex sm:hidden items-center gap-1">
                  {!currentUser && (
                    <a
                      href="/build"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2.5 py-1.5 rounded-md text-xs font-medium hover:from-blue-700 hover:to-purple-700 transition-all min-w-touch min-h-touch flex items-center justify-center"
                    >
                      Get Funded
                    </a>
                  )}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 min-w-touch min-h-touch">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Disclosure.Panel className="sm:hidden bg-white border-t border-gray-200">
                <div className="space-y-1 px-2 py-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                  {navigation
                    .filter(
                      (item) => !item.auth || (item.auth && currentUser)
                    )
                    .map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                        "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium min-h-touch transition-colors"
                      )}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {item.icon && (
                        <item.icon 
                          className={classNames(
                            pathname === item.href
                              ? "text-blue-600"
                              : "text-gray-400",
                            "mr-3 h-4 w-4 sm:h-5 sm:w-5"
                          )}
                        />
                      )}
                      <span className="flex-1">{item.name}</span>
                    </Disclosure.Button>
                  ))}
                  
                  {!currentUser && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href="/login"
                        className="block bg-gray-100 text-gray-900 px-3 py-2.5 rounded-md text-sm font-medium text-center min-h-touch"
                      >
                        Sign in
                      </a>
                    </div>
                  )}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
      <div className="bg-white shadow-sm hidden sm:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <Breadcrumbs />
        </div>
      </div>
    </div>
  );
}
