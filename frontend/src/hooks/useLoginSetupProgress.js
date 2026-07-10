/**
 * useLoginSetupProgress — derive setup steps/progress for login + navbar.
 */

import { useMemo } from "react";
import { getLoginSteps, getSetupProgress, getNavbarSetupLabel } from "@/lib/onboarding/loginSteps";

/**
 * @param {{
 *   role?: 'builder' | 'backer' | null,
 *   currentUser?: object | null,
 *   anyWalletConnected?: boolean,
 *   linked?: boolean,
 *   alreadyLinked?: boolean,
 *   hasAnyWallet?: boolean,
 *   linkedWallets?: object[],
 * }} params
 */
export default function useLoginSetupProgress(params) {
  const {
    role = null,
    currentUser = null,
    anyWalletConnected = false,
    linked = false,
    alreadyLinked = false,
    hasAnyWallet = false,
    linkedWallets = [],
  } = params;

  const steps = useMemo(
    () => getLoginSteps({ role, currentUser, anyWalletConnected, linked, alreadyLinked }),
    [role, currentUser, anyWalletConnected, linked, alreadyLinked],
  );

  const progress = useMemo(() => getSetupProgress(steps), [steps]);

  const navbarLabel = useMemo(
    () => getNavbarSetupLabel({ hasAnyWallet, currentUser, linkedWallets }),
    [hasAnyWallet, currentUser, linkedWallets],
  );

  return { steps, progress, navbarLabel };
}
