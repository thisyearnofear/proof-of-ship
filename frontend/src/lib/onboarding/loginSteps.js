/**
 * Login setup step model — shared by login page and navbar.
 */

/** @typedef {'pending' | 'active' | 'complete'} StepStatus */

/** @typedef {{ id: string, label: string, status: StepStatus }} SetupStep */

/**
 * @param {{
 *   role: 'builder' | 'backer' | null,
 *   currentUser: object | null,
 *   anyWalletConnected: boolean,
 *   linked: boolean,
 *   alreadyLinked?: boolean,
 * }} state
 * @returns {SetupStep[]}
 */
export function getLoginSteps(state) {
  const { role, currentUser, anyWalletConnected, linked, alreadyLinked = false } = state;
  const verified = linked || alreadyLinked;

  if (!role) {
    return [
      { id: "role", label: "Role", status: "active" },
      { id: "auth", label: "Account", status: "pending" },
      { id: "wallet", label: "Wallet", status: "pending" },
      { id: "verify", label: "Verify", status: "pending" },
    ];
  }

  if (role === "backer") {
    const walletStatus = anyWalletConnected ? "complete" : "active";
    const verifyStatus = verified ? "complete" : anyWalletConnected ? "active" : "pending";
    return [
      { id: "role", label: "Role", status: "complete" },
      { id: "wallet", label: "Wallet", status: walletStatus },
      { id: "verify", label: "Verify", status: verifyStatus },
    ];
  }

  const githubStatus = currentUser ? "complete" : "active";
  const walletStatus = anyWalletConnected
    ? "complete"
    : currentUser
      ? "active"
      : "pending";
  const verifyStatus = verified
    ? "complete"
    : currentUser && anyWalletConnected
      ? "active"
      : "pending";

  return [
    { id: "role", label: "Role", status: "complete" },
    { id: "github", label: "GitHub", status: githubStatus },
    { id: "wallet", label: "Wallet", status: walletStatus },
    { id: "verify", label: "Verify", status: verifyStatus },
  ];
}

/**
 * @param {SetupStep[]} steps
 * @returns {{ completed: number, total: number, current: number, label: string }}
 */
export function getSetupProgress(steps) {
  const total = steps.length;
  const completed = steps.filter((s) => s.status === "complete").length;
  const current = steps.find((s) => s.status === "active");
  const currentIndex = current ? steps.indexOf(current) + 1 : completed;

  return {
    completed,
    total,
    current: Math.max(currentIndex, completed),
    label: completed >= total ? "Done" : `${Math.max(completed + 1, currentIndex)}/${total}`,
  };
}

/**
 * Navbar label when wallet is connected but Firebase auth is incomplete.
 * @param {{ hasAnyWallet: boolean, currentUser: object | null, linkedWallets: object[] }} state
 * @returns {string | null}
 */
export function getNavbarSetupLabel(state) {
  const { hasAnyWallet, currentUser, linkedWallets } = state;
  if (currentUser || !hasAnyWallet) return null;

  if (linkedWallets.length > 0) {
    return "Finish setup (1/2)";
  }
  return "Finish setup (1/3)";
}

/**
 * @param {'builder' | 'backer'} role
 * @param {string} [redirect]
 * @returns {string}
 */
export function getPostLoginDestination(role, redirect) {
  if (redirect && typeof redirect === "string") return redirect;
  return role === "backer" ? "/back?tab=discover" : "/build?tab=wins";
}
