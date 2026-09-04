/**
 * Capital stack rails — single source of truth for the three funding instruments.
 */

/** @typedef {'live' | 'beta' | 'coming_soon'} RailStatus */

/** @type {Record<RailStatus, string>} */
export const RAIL_STATUS_LABELS = {
  live: "Live",
  beta: "Beta",
  coming_soon: "Coming soon",
};

/** @type {Record<RailStatus, string>} */
export const RAIL_STATUS_STYLES = {
  live: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  beta: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  coming_soon: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/** @type {Record<string, { border: string, label: string, pill: string }>} */
export const RAIL_TONES = {
  purple: {
    border: "border-t-purple-500",
    label: "text-purple-600 dark:text-purple-400",
    pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  blue: {
    border: "border-t-blue-500",
    label: "text-blue-600 dark:text-blue-400",
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  green: {
    border: "border-t-green-500",
    label: "text-green-600 dark:text-green-400",
    pill: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};

/**
 * @typedef {Object} CapitalRail
 * @property {string} id
 * @property {RailStatus} status
 * @property {'purple' | 'blue' | 'green'} tone
 * @property {string} eyebrow
 * @property {string} tag
 * @property {string} title
 * @property {string} shortTitle
 * @property {string} emoji
 * @property {string} description
 * @property {string[]} bullets
 * @property {string} footerLeft
 * @property {string} footerRight
 */

/** @type {CapitalRail[]} */
export const CAPITAL_RAILS = [
  {
    id: "bags",
    status: "coming_soon",
    tone: "purple",
    eyebrow: "Rail 1",
    tag: "Pre-prize",
    title: "Bags Token",
    shortTitle: "Bags",
    emoji: "🎒",
    description:
      "No prize pipeline yet? Launch a project token on Solana. Community buys in, you earn fee-share yield.",
    bullets: [
      "Community capital from token buyers",
      "Fee-share yield from trading volume",
      "No verification required",
    ],
    footerLeft: "Backer yield: Fee-share %",
    footerRight: "Risk: Market-driven",
  },
  {
    id: "x402",
    status: "live",
    tone: "blue",
    eyebrow: "Rail 2",
    tag: "Mid-stage",
    title: "x402 Credit Line",
    shortTitle: "Credit",
    emoji: "💳",
    description:
      "Have milestones to ship? Get a USDC credit line backed by your future hackathon prizes.",
    bullets: [
      "Up to $5,000 USDC credit",
      "Collateralized by prize pipeline",
      "AI agents verify milestones",
    ],
    footerLeft: "Backer yield: Principal + multiplier",
    footerRight: "Risk: Milestone-driven",
  },
  {
    id: "prize",
    status: "live",
    tone: "green",
    eyebrow: "Rail 3",
    tag: "Settlement",
    title: "Prize Routing",
    shortTitle: "Prize Routing",
    emoji: "🏆",
    description:
      "Won a hackathon? Route the prize through the platform to auto-repay backers and keep the rest.",
    bullets: [
      "Auto-repay backers from prize",
      "Payout verification on 3 chains",
      "Leaderboard ranks fastest payouts",
    ],
    footerLeft: "Backer yield: Principal + multiplier",
    footerRight: "Risk: Prize-dependent",
  },
];

/**
 * @param {string} id
 * @returns {CapitalRail | undefined}
 */
export function getRailById(id) {
  return CAPITAL_RAILS.find((rail) => rail.id === id);
}

/**
 * @param {string} id
 * @returns {RailStatus | undefined}
 */
export function getRailStatus(id) {
  return getRailById(id)?.status;
}

/**
 * @param {RailStatus | undefined} status
 * @returns {boolean}
 */
export function isRailAvailable(status) {
  return status === "live" || status === "beta";
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isRailIntegrated(id) {
  return isRailAvailable(getRailStatus(id));
}

export const CAPITAL_STACK_HEADING = "Capital That Grows With You";
export const CAPITAL_STACK_SUBHEADING =
  "Three capital instruments, one progression. Start where you are, level up as you ship.";
export const CAPITAL_STACK_FOOTNOTE =
  "The rails are composable — use one or all three. The agent layer recommends which fits your stage.";

/** Landing page anchor for deep links from Agents tab and elsewhere. */
export const CAPITAL_STACK_ANCHOR_ID = "capital-stack";
export const CAPITAL_STACK_HREF = `/#${CAPITAL_STACK_ANCHOR_ID}`;
export const AGENTS_CAPITAL_HINT =
  "Start with payout truth and an Underwriter packet — credit rails come after the win is verified.";
