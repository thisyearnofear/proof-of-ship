import Link from "next/link";
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
  BoltIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { useNanopayment, useWallet } from "@/contexts/WalletContext";
import { Fragment } from "react";
import Breadcrumbs from "../../Breadcrumbs";
import ThemeToggle from "../../ThemeToggle";

const navigation = [
  { 
    name: "Discover", 
    href: "/explore", 
    icon: GlobeAltIcon,
  },
  { 
    name: "Leaderboards", 
    href: "/leaderboard", 
    icon: TrophyIcon,
  },
  { 
    name: "Build", 
    href: "/build", 
    icon: CreditCardIcon,
    auth: true,
    builderOnly: true,
  },
  { 
    name: "Back", 
    href: "/back", 
    icon: ChartBarIcon,
  },
  { 
    name: "Analyze", 
    href: "/analyze", 
    icon: CalculatorIcon,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const router = useRouter();
  const pathname = router.asPath;
  const { currentUser, logout, userRole, linkedWallets } = useUser();
  const { isInitialized: nanopayReady, balance } = useNanopayment();
  const wallet = useWallet();
  const { disconnect: disconnectEvm, disconnectSolana, solanaAddress, account } = wallet;
  const githubUsername = currentUser?.reloadUserInfo?.screenName
    || currentUser?.providerData?.find((p) => p.providerId === "github.com")?.displayName?.toLowerCase().replace(/\s/g, '')
    || null;

  const activeWallet = solanaAddress
    ? { label: `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`, color: 'purple' }
    : account
      ? { label: `${account.slice(0, 6)}...${account.slice(-4)}`, color: 'orange' }
      : null;

  const handleLogout = async () => {
    disconnectEvm();
    disconnectSolana();
    await logout();
  };

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
      <Disclosure as="nav" className="bg-surface shadow-lg border-b border-default">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
              <div className="flex h-14 sm:h-16 justify-between items-center">
                <div className="flex items-center flex-shrink-0">
                  <div className="flex shrink-0 items-center">
                    <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                      <img
                        src="/POS.png"
                        alt="Proof Of Ship Logo"
                        width={32}
                        height={32}
                        className="rounded w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <div className="hidden sm:block">
                        <div className="text-base sm:text-lg font-bold text-primary">Proof of Ship</div>
                      </div>
                    </Link>
                  </div>
                  <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                    {navigation
                      .filter(
                        (item) => {
                          if (item.auth && !currentUser) return false;
                          if (item.builderOnly && userRole === 'backer') return false;
                          return true;
                        }
                      )
                      .map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            pathname === item.href
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "text-secondary hover:text-gray-900 hover:bg-gray-50 border-transparent",
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
                                  : "text-muted group-hover:text-gray-600",
                                "mr-2 h-4 w-4"
                              )}
                            />
                          )}
                          {item.name}
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="hidden sm:ml-4 sm:flex sm:items-center gap-2 sm:gap-3">
                  {/* Balance indicator */}
                  {nanopayReady && currentUser && (
                    <Link
                      href="/back"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors text-xs"
                      title="AI agent balance"
                    >
                      <BoltIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span className="font-semibold text-teal-700 dark:text-teal-300">
                        ${parseFloat(balance?.available || 0).toFixed(2)}
                      </span>
                    </Link>
                  )}

                  <ThemeToggle />

                  {currentUser ? (
                    /* ── Logged-in: wallet indicator + avatar + name/role, dropdown with identity ── */
                    <div className="flex items-center gap-2">
                      {activeWallet && (
                        <div className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-mono ${activeWallet.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${activeWallet.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                          {activeWallet.label}
                        </div>
                      )}
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        {currentUser.photoURL ? (
                          <img className="h-7 w-7 rounded-full ring-2 ring-blue-500/30" src={currentUser.photoURL} alt="" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
                            {userRole === 'backer' ? 'B' : 'U'}
                          </div>
                        )}
                        <div className="hidden md:flex flex-col items-start text-left leading-tight">
                          <span className="text-xs font-semibold text-primary truncate max-w-[100px]">
                            {currentUser.displayName || (activeWallet ? activeWallet.label : 'User')}
                          </span>
                          <span className={`text-[10px] font-medium ${userRole === 'backer' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {userRole === 'backer' ? 'Backer' : 'Builder'}
                          </span>
                        </div>
                      </Menu.Button>

                      <Transition as={Fragment}
                        enter="transition ease-out duration-200" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-xl bg-surface shadow-xl ring-1 ring-black/5 focus:outline-none border border-default overflow-hidden">
                          {/* Identity header */}
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border-b border-default">
                            <div className="flex items-center gap-3">
                              {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                  {userRole === 'backer' ? 'B' : 'U'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-primary truncate">{currentUser.displayName || 'User'}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${userRole === 'backer' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
                                    {userRole === 'backer' ? 'Backer' : 'Builder'}
                                  </span>
                                  {githubUsername && <span className="text-[10px] text-tertiary truncate">gh/{githubUsername}</span>}
                                  {activeWallet && <span className={`text-[10px] font-mono ${activeWallet.color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`}>{activeWallet.label}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {githubUsername ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  GitHub connected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 dark:text-amber-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                                  No GitHub linked
                                </span>
                              )}
                              {activeWallet ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Wallet connected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 dark:text-amber-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                                  No wallet linked
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-1">
                            {githubUsername && (
                              <Menu.Item>{({ active }) => (
                                <Link href={`/u/${githubUsername}`}
                                  className={classNames(active ? "bg-gray-50 dark:bg-gray-700/50" : "", "flex items-center px-4 py-2 text-sm text-primary")}>
                                  <GlobeAltIcon className="mr-3 h-4 w-4 text-muted" /> My Portfolio
                                </Link>
                              )}</Menu.Item>
                            )}
                            <Menu.Item>{({ active }) => (
                              <Link href="/profile"
                                className={classNames(active ? "bg-gray-50 dark:bg-gray-700/50" : "", "flex items-center px-4 py-2 text-sm text-primary")}>
                                <UserCircleIcon className="mr-3 h-4 w-4 text-muted" /> Profile &amp; Wallets
                              </Link>
                            )}</Menu.Item>
                            <Menu.Item>{({ active }) => (
                              <Link href="/build"
                                className={classNames(active ? "bg-gray-50 dark:bg-gray-700/50" : "", "flex items-center px-4 py-2 text-sm text-primary")}>
                                <CreditCardIcon className="mr-3 h-4 w-4 text-muted" /> Credit Dashboard
                              </Link>
                            )}</Menu.Item>
                            {userRole !== 'backer' && (
                              <Menu.Item>{({ active }) => (
                                <Link href="/admin/verification"
                                  className={classNames(active ? "bg-orange-50 dark:bg-orange-900/20" : "", "flex items-center px-4 py-2 text-sm text-orange-700 dark:text-orange-400 font-semibold")}>
                                  <ShieldCheckIcon className="mr-3 h-4 w-4" /> Verification Dashboard
                                </Link>
                              )}</Menu.Item>
                            )}
                            {userRole !== 'backer' && (
                              <Menu.Item>{({ active }) => (
                                <Link href="/admin/payout-simulation"
                                  className={classNames(active ? "bg-blue-50 dark:bg-blue-900/20" : "", "flex items-center px-4 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium")}>
                                  <CalculatorIcon className="mr-3 h-4 w-4" /> Payout Simulator
                                </Link>
                              )}</Menu.Item>
                            )}
                          </div>
                          <div className="border-t border-default py-1">
                            <Menu.Item>{({ active }) => (
                              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}
                                className={classNames(active ? "bg-red-50 dark:bg-red-900/20" : "", "flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400")}>
                                Sign out
                              </a>
                            )}</Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                    </div>
                  ) : activeWallet ? (
                    /* ── Wallet connected but not authenticated ── */
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${activeWallet.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'}`}>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${activeWallet.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                        {activeWallet.label}
                      </div>
                      <Link href="/login"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all min-h-touch flex items-center justify-center shadow-sm">
                        Complete setup
                      </Link>
                    </div>
                  ) : (
                    /* ── Signed-out: clear CTA buttons ── */
                    <div className="flex items-center gap-2">
                      <Link href="/login"
                        className="px-3 py-1.5 text-sm font-medium text-primary hover:text-gray-900 dark:hover:text-white border border-default rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        Sign in
                      </Link>
                      <Link href="/login"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all min-h-touch flex items-center justify-center shadow-sm">
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex sm:hidden items-center gap-1">
                  {currentUser ? (
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center">
                        {currentUser.photoURL ? (
                          <img className="h-7 w-7 rounded-full ring-2 ring-blue-500/30" src={currentUser.photoURL} alt="" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
                            {userRole === 'backer' ? 'B' : 'U'}
                          </div>
                        )}
                      </Menu.Button>
                      <Transition as={Fragment}
                        enter="transition ease-out duration-200" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-xl bg-surface shadow-xl ring-1 ring-black/5 focus:outline-none border border-default overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border-b border-default">
                            <p className="text-sm font-bold text-primary truncate">{currentUser.displayName || 'User'}</p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${userRole === 'backer' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
                                {userRole === 'backer' ? 'Backer' : 'Builder'}
                              </span>
                              {githubUsername && <span className="text-[10px] text-tertiary">gh/{githubUsername}</span>}
                              {activeWallet && <span className={`text-[10px] font-mono ${activeWallet.color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`}>{activeWallet.label}</span>}
                            </div>
                            {/* Identity status */}
                            <div className="mt-1.5 flex gap-2 flex-wrap">
                              {githubUsername ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  GitHub
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">No GitHub</span>
                              )}
                              {activeWallet ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Wallet
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">No wallet</span>
                              )}
                            </div>
                          </div>
                          <div className="py-1">
                            <Menu.Item>{({ active }) => (
                              <Link href="/profile" className={classNames(active ? "bg-gray-50 dark:bg-gray-700/50" : "", "flex items-center px-4 py-2.5 text-sm text-primary")}>
                                <UserCircleIcon className="mr-3 h-4 w-4 text-muted" /> Profile &amp; Wallets
                              </Link>
                            )}</Menu.Item>
                            <Menu.Item>{({ active }) => (
                              <Link href="/build" className={classNames(active ? "bg-gray-50 dark:bg-gray-700/50" : "", "flex items-center px-4 py-2.5 text-sm text-primary")}>
                                <CreditCardIcon className="mr-3 h-4 w-4 text-muted" /> Credit Dashboard
                              </Link>
                            )}</Menu.Item>
                          </div>
                          <div className="border-t border-default py-1">
                            <Menu.Item>{({ active }) => (
                              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}
                                className={classNames(active ? "bg-red-50 dark:bg-red-900/20" : "", "flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400")}>
                                Sign out
                              </a>
                            )}</Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : activeWallet ? (
                    <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold min-h-touch flex items-center justify-center">
                      Complete setup
                    </Link>
                  ) : (
                    <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold min-h-touch flex items-center justify-center">
                      Get Started
                    </Link>
                  )}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-1.5 text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 min-w-touch min-h-touch">
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
              <Disclosure.Panel className="sm:hidden bg-surface border-t border-default">
                <div className="space-y-1 px-2 py-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                  {navigation
                    .filter(
                      (item) => {
                        if (item.auth && !currentUser) return false;
                        if (item.builderOnly && userRole === 'backer') return false;
                        return true;
                      }
                    )
                    .map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800",
                        "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium min-h-touch transition-colors"
                      )}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {item.icon && (
                        <item.icon 
                          className={classNames(
                            pathname === item.href
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted",
                            "mr-3 h-4 w-4 sm:h-5 sm:w-5"
                          )}
                        />
                      )}
                      <span className="flex-1">{item.name}</span>
                    </Disclosure.Button>
                  ))}

                  {/* Mobile balance + AI agents button */}
                  {nanopayReady && (
                    <div className="mt-2 pt-2 border-t border-default">
                      <Link
                        href="/back"
                        className="flex items-center justify-between rounded-md px-3 py-2.5 bg-teal-50 dark:bg-teal-900/20 text-sm font-medium min-h-touch"
                      >
                        <span className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                          <BoltIcon className="w-4 h-4" />
                          AI Agents
                        </span>
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                          ${parseFloat(balance?.available || 0).toFixed(2)}
                        </span>
                      </Link>
                    </div>
                  )}
                  
                  {!currentUser && (
                    <div className="mt-4 pt-4 border-t border-default">
                      {activeWallet && (
                        <div className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-md text-xs font-mono ${activeWallet.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'}`}>
                          <span className={`w-2 h-2 rounded-full animate-pulse ${activeWallet.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                          {activeWallet.label}
                        </div>
                      )}
                      <Link
                        href="/login"
                        className="block bg-surface-tertiary text-primary px-3 py-2.5 rounded-md text-sm font-medium text-center min-h-touch"
                      >
                        {activeWallet ? 'Complete setup' : 'Sign in'}
                      </Link>
                    </div>
                  )}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
      <div className="bg-surface shadow-sm hidden sm:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <Breadcrumbs />
        </div>
      </div>
    </div>
  );
}
