/**
 * Stores barrel — re-exports for ergonomic imports.
 *
 * Before: `import { useUser } from "@/contexts/UserContext"`
 * After:  `import { useUser } from "@/stores"`
 * (or keep the path-specific import, both work)
 */

export {
  authStore,
  authActions,
  useAuthStore,
  useUser,
  initAuthStore,
} from "./authStore";

export {
  profileStore,
  profileActions,
  useProfileStore,
  useTheme,
  useUserBehavior,
  useApp,
  initProfileStore,
} from "./profileStore";

export {
  walletStore,
  walletActions,
  useWalletStore,
  useWallet,
  useCircle,
  useCircleWallet,
  useBuilderCredit,
  useNanopayment,
  useFinancial,
  useLiFi,
  initWalletStore,
  EvmWalletHydrator,
  SolanaWalletHydrator,
} from "./walletStore";
