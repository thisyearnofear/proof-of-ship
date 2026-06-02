/**
 * CapitalStack — the "Three Rails" visual on the landing page.
 *
 * Self-contained presentational section: Bags Token → x402 Credit Line →
 * Prize Routing. No props.
 */
import { Card } from "@/components/common/Card";

const Arrow = () => (
  <div className="hidden md:flex items-center self-center">
    <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

const Rail = ({ rail, tone }) => (
  <Card className={`relative p-6 border-t-4 ${tone.border} bg-surface shadow-card hover:shadow-card-hover transition-shadow`}>
    <div className="flex items-center gap-2 mb-1">
      <span className={`text-xs font-bold uppercase tracking-wider ${tone.label}`}>{rail.eyebrow}</span>
      <span className={`px-2 py-0.5 text-[10px] font-semibold ${tone.pill} rounded-full`}>{rail.tag}</span>
    </div>
    <h3 className="text-lg font-bold text-primary mb-2">{rail.title}</h3>
    <p className="text-sm text-secondary mb-4">{rail.description}</p>
    <ul className="space-y-2 text-sm text-secondary">
      {rail.bullets.map((b) => (
        <li key={b} className="flex items-start gap-2">• {b}</li>
      ))}
    </ul>
    <div className="mt-4 pt-4 border-t border-default">
      <div className="flex items-center justify-between text-xs text-tertiary">
        <span>{rail.footerLeft}</span>
        <span>{rail.footerRight}</span>
      </div>
    </div>
  </Card>
);

const TONES = {
  purple: { border: 'border-t-purple-500', label: 'text-purple-600 dark:text-purple-400', pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  blue:   { border: 'border-t-blue-500',   label: 'text-blue-600 dark:text-blue-400',     pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  green:  { border: 'border-t-green-500',  label: 'text-green-600 dark:text-green-400',   pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

const RAILS = [
  {
    tone: 'purple',
    eyebrow: 'Rail 1',
    tag: 'Pre-prize',
    title: 'Bags Token',
    description: 'No prize pipeline yet? Launch a project token on Solana. Community buys in, you earn fee-share yield.',
    bullets: [
      'Community capital from token buyers',
      'Fee-share yield from trading volume',
      'No verification required',
    ],
    footerLeft: 'Backer yield: Fee-share %',
    footerRight: 'Risk: Market-driven',
  },
  {
    tone: 'blue',
    eyebrow: 'Rail 2',
    tag: 'Mid-stage',
    title: 'x402 Credit Line',
    description: 'Have milestones to ship? Get a USDC credit line backed by your future hackathon prizes.',
    bullets: [
      'Up to $5,000 USDC credit',
      'Collateralized by prize pipeline',
      'AI agents verify milestones',
    ],
    footerLeft: 'Backer yield: Principal + multiplier',
    footerRight: 'Risk: Milestone-driven',
  },
  {
    tone: 'green',
    eyebrow: 'Rail 3',
    tag: 'Settlement',
    title: 'Prize Routing',
    description: 'Won a hackathon? Route the prize through the platform to auto-repay backers and keep the rest.',
    bullets: [
      'Auto-repay backers from prize',
      'Payout verification on 3 chains',
      'Leaderboard ranks fastest payouts',
    ],
    footerLeft: 'Backer yield: Principal + multiplier',
    footerRight: 'Risk: Prize-dependent',
  },
];

export default function CapitalStack() {
  return (
    <div className="py-12 sm:py-16 bg-surface border-t border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            Capital That Grows With You
          </h2>
          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto">
            Three capital instruments, one progression. Start where you are, level up as you ship.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 sm:gap-6">
          <Rail rail={RAILS[0]} tone={TONES.purple} />
          <Arrow />
          <Rail rail={RAILS[1]} tone={TONES.blue} />
          <Arrow />
          <Rail rail={RAILS[2]} tone={TONES.green} />
        </div>

        <p className="text-center text-xs sm:text-sm text-tertiary mt-8">
          The rails are composable — use one or all three. The agent layer recommends which fits your stage.
        </p>
      </div>
    </div>
  );
}
