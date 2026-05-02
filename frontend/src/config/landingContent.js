/**
 * Landing page content — extracted from index.js for maintainability.
 */
import {
  ChartBarIcon,
  SparklesIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  CubeIcon,
  MapIcon,
  EyeIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export const LANDING_FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "Reputation Collateral",
    description:
      "AI agents analyze your shipping history and GitHub activity to form your credit foundation. No traditional collateral needed.",
  },
  {
    icon: BanknotesIcon,
    title: "Backer Staking",
    description:
      "Backers stake USDC with 1.5x, 2x, or 3x reward tiers. Higher backer confidence unlocks better credit terms for builders.",
  },
  {
    icon: RocketLaunchIcon,
    title: "Ship to Unlock Credit",
    description:
      "Deliver milestones to verify backer stakes and unlock the next tier of credit. A virtuous cycle of shipping and funding.",
  },
  {
    icon: ChartBarIcon,
    title: "AI-Powered Scoring",
    description:
      "On-chain reputation sets your credit limit. AI agents analyze per-query via x402 nanopayments — zero gas, sub-second settlement.",
  },
];

export const USER_JOURNEYS = {
  developers: {
    title: "For Builders",
    subtitle: "Build reputation, unlock credit, ship faster",
    steps: [
      {
        icon: PlusCircleIcon,
        title: "Create Your Project",
        desc: "Submit your project with GitHub integration. Your shipping history becomes your credit foundation.",
      },
      {
        icon: ShieldCheckIcon,
        title: "Build Reputation",
        desc: "Ship milestones to increase your on-chain reputation score and unlock higher credit tiers.",
      },
      {
        icon: BanknotesIcon,
        title: "Access Credit",
        desc: "Draw USDC credit lines collateralized by your reputation and backer staking.",
      },
      {
        icon: RocketLaunchIcon,
        title: "Win & Repay",
        desc: "Win hackathon prizes that auto-repay your backers. Your reputation compounds for next time.",
      },
    ],
  },
  backers: {
    title: "For Backers",
    subtitle: "Scout talent, stake on builders, earn rewards",
    steps: [
      {
        icon: MagnifyingGlassIcon,
        title: "Scout Builders",
        desc: "AI agents score projects by analyzing GitHub activity, on-chain history, and shipping velocity.",
      },
      {
        icon: ChartBarIcon,
        title: "Stake with Multipliers",
        desc: "Back builders you believe in with 1.5x–3x reward multipliers. Your stake boosts their credit.",
      },
      {
        icon: CubeIcon,
        title: "Earn Returns",
        desc: "When backed builders win prizes, your stake is repaid with interest from the prize pool.",
      },
      {
        icon: EyeIcon,
        title: "Private Staking",
        desc: "Optionally shield your positions from public explorers via Cloak's UTXO pool on Solana.",
      },
    ],
  },
  organizers: {
    title: "For Organizers",
    subtitle: "Track builders, manage hackathons, recognize achievements",
    steps: [
      {
        icon: EyeIcon,
        title: "Track Builder Progress",
        desc: "Monitor builder participation and project progress in real-time across ecosystems.",
      },
      {
        icon: MapIcon,
        title: "Manage Hackathons",
        desc: "Organize and track hackathon participation across your ecosystem.",
      },
      {
        icon: ChatBubbleLeftRightIcon,
        title: "Collect Feedback",
        desc: "Gather valuable feedback from builders to improve your programs.",
      },
      {
        icon: FlagIcon,
        title: "Recognize Achievements",
        desc: "Highlight successful builders and projects in your ecosystem.",
      },
    ],
  },
};
