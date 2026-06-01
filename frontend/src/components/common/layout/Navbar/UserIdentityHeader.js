/**
 * UserIdentityHeader — Avatar + name + role + GitHub + wallet status.
 *
 * Extracted from Navbar because the same panel is rendered inside both
 * the desktop user dropdown and the mobile user dropdown. The optional
 * `compact` prop shrinks the layout for the smaller mobile dropdown.
 */

import { classNames } from "@/utils/common";

interface ActiveWallet {
  label: string;
  color: "purple" | "orange";
}

interface UserIdentityHeaderProps {
  currentUser: { photoURL?: string | null; displayName?: string | null };
  userRole: "builder" | "backer" | null;
  githubUsername: string | null;
  activeWallet: ActiveWallet | null;
  compact?: boolean;
  showStatus?: boolean;
}

export default function UserIdentityHeader({
  currentUser,
  userRole,
  githubUsername,
  activeWallet,
  compact = false,
  showStatus = true,
}: UserIdentityHeaderProps) {
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
            {activeWallet && (
              <span className={classNames(
                "text-[10px] font-mono",
                activeWallet.color === "purple" ? "text-purple-500" : "text-orange-500",
              )}>
                {activeWallet.label}
              </span>
            )}
          </div>
        </div>
      </div>
      {showStatus && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {githubUsername ? <StatusPill ok label="GitHub connected" /> : <StatusPill label="No GitHub linked" />}
          {activeWallet ? <StatusPill ok label="Wallet connected" /> : <StatusPill label="No wallet linked" />}
        </div>
      )}
    </div>
  );
}

function StatusPill({ ok = false, label }: { ok?: boolean; label: string }) {
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
