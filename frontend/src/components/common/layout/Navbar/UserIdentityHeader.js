/**
 * UserIdentityHeader — Avatar + name + role + GitHub + wallet list.
 *
 * Shows all linked wallets with per-wallet connection state
 * (connected = live extension, linked = persisted in Firestore).
 */

import { classNames } from "@/utils/common";

/**
 * @typedef {{ address: string, chainFamily: "evm" | "solana", isConnected: boolean }} WalletEntry
 * @typedef {{
 *   currentUser: { photoURL?: string | null, displayName?: string | null },
 *   userRole: "builder" | "backer" | null,
 *   githubUsername: string | null,
 *   wallets: WalletEntry[],
 *   compact?: boolean,
 *   showStatus?: boolean,
 * }} UserIdentityHeaderProps
 */

function formatAddress(addr, chainFamily) {
  if (chainFamily === "solana") return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function UserIdentityHeader(/** @type {UserIdentityHeaderProps} */ {
  currentUser,
  userRole,
  githubUsername,
  wallets = [],
  compact = false,
  showStatus = true,
}) {
  const connectedCount = wallets.filter((w) => w.isConnected).length;

  return (
    <div className={classNames("bg-gray-50 dark:bg-gray-900/80 border-b border-default", compact ? "px-4 py-3" : "px-4 py-3")}>
      <div className="flex items-center gap-3">
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt=""
            className={classNames("rounded-full", compact ? "w-9 h-9" : "w-10 h-10")}
          />
        ) : (
          <div className={classNames(
            "rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold",
            compact ? "w-9 h-9 text-sm" : "w-10 h-10",
          )}>
            {userRole === "backer" ? "B" : "U"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={classNames("font-bold text-primary truncate", compact ? "text-sm" : "text-sm")}>
            {currentUser.displayName || "User"}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={classNames(
              "px-1.5 py-0.5 text-[10px] font-semibold rounded",
              userRole === "backer"
                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
            )}>
              {userRole === "backer" ? "Backer" : "Builder"}
            </span>
            {githubUsername && (
              <span className="text-[10px] text-tertiary truncate">gh/{githubUsername}</span>
            )}
          </div>
        </div>
      </div>

      {showStatus && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {githubUsername ? <StatusPill ok label="GitHub connected" /> : <StatusPill label="No GitHub linked" />}
          {wallets.length === 0 ? (
            <StatusPill label="No wallets linked" />
          ) : connectedCount > 0 ? (
            <StatusPill ok label={`${connectedCount} wallet${connectedCount > 1 ? "s" : ""} connected`} />
          ) : (
            <StatusPill label="Wallets linked, none connected" />
          )}
        </div>
      )}

      {wallets.length > 0 && (
        <div className="mt-2 space-y-1">
          {wallets.map((w) => (
            <WalletRow key={w.address} wallet={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function WalletRow(/** @type {{ wallet: WalletEntry }} */ { wallet }) {
  const isSolana = wallet.chainFamily === "solana";
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center gap-2 min-w-0">
        <span className={classNames(
          "px-1.5 py-0.5 text-[10px] font-semibold rounded flex-shrink-0",
          isSolana
            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
        )}>
          {isSolana ? "Phantom" : "MetaMask"}
        </span>
        <span className="text-[11px] font-mono text-primary truncate">
          {formatAddress(wallet.address, wallet.chainFamily)}
        </span>
      </div>
      {wallet.isConnected ? (
        <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Connected
        </span>
      ) : (
        <span className="text-[10px] text-tertiary flex-shrink-0">Linked</span>
      )}
    </div>
  );
}

function StatusPill(/** @type {{ ok?: boolean, label: string }} */ { ok = false, label }) {
  const cls = ok
    ? "text-green-600 dark:text-green-400"
    : "text-amber-500 dark:text-amber-400";
  return (
    <span className={classNames("inline-flex items-center gap-1 text-[10px]", cls)}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {ok ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        )}
      </svg>
      {label}
    </span>
  );
}
