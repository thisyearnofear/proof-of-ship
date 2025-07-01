import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useGithub } from "@/providers/Github/Github";
import { useAuth } from "@/contexts/AuthContext";
import { Fragment } from "react";
import Breadcrumbs from "../../Breadcrumbs";
import ThemeToggle from "../../ThemeToggle";

const navigation = [
  { name: "Shippers", href: "/shippers" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "About", href: "/about" },
  { name: "Papa", href: "/papa" },
  { name: "Issues", href: "/issues", hidden: true },
  { name: "Pulls", href: "/pulls", hidden: true },
  { name: "Releases", href: "/releases", hidden: true },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const pathname = usePathname();
  const { repos, selectedSlug, setSelectedSlug } = useGithub();
  const { currentUser, logout } = useAuth();

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
        className="icon-md"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
      </svg>
    );
  };

  return (
    <div>
      <Disclosure as="nav" className="bg-white shadow">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div className="flex shrink-0 items-center">
                    <img
                      src="/POS.png"
                      alt="Proof Of Ship Logo"
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            pathname === item.href
                              ? "text-amber-600"
                              : "text-gray-500 hover:text-amber-600",
                            "inline-flex cursor-pointer items-center px-1 pt-1 text-sm font-medium"
                          )}
                          aria-current={
                            pathname === item.href ? "page" : undefined
                          }
                        >
                          {item.name}
                        </a>
                      ))}
                  </div>
                </div>

                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <a
                    href="https://github.com/thisyearnofear/POS-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">View GitHub repository</span>
                    <GithubIcon />
                  </a>

                  {/* Profile dropdown */}
                  {currentUser ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                          <span className="sr-only">Open user menu</span>
                          {currentUser.photoURL ? (
                            <img
                              className="h-8 w-8 rounded-full"
                              src={currentUser.photoURL}
                              alt={currentUser.displayName || "User"}
                            />
                          ) : (
                            <UserCircleIcon className="icon-lg text-gray-400" />
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="/profile"
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                Your Profile
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
                    <a
                      href="/login"
                      className="text-gray-500 hover:text-amber-600 inline-flex items-center px-3 py-1 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Sign in
                    </a>
                  )}
                  <ThemeToggle />
                </div>

                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block icon-md" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block icon-md" aria-hidden="true" />
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
              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 px-2 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800",
                        "block rounded-md px-3 py-2 text-base font-medium"
                      )}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <Breadcrumbs />
        </div>
      </div>
    </div>
  );
}
