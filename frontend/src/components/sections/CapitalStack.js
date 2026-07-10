/**
 * CapitalStack — the "Three Rails" visual.
 *
 * Reads rail definitions from config/capitalStack.js. Supports a compact
 * variant for embedded contexts (e.g. build page empty state).
 */
import React from "react";
import { Card } from "@/components/common/Card";
import {
  CAPITAL_RAILS,
  RAIL_TONES,
  RAIL_STATUS_LABELS,
  RAIL_STATUS_STYLES,
  CAPITAL_STACK_HEADING,
  CAPITAL_STACK_SUBHEADING,
  CAPITAL_STACK_FOOTNOTE,
  CAPITAL_STACK_ANCHOR_ID,
} from "@/config/capitalStack";

const Arrow = () => (
  <div className="hidden md:flex items-center self-center">
    <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

function RailStatusPill({ status }) {
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${RAIL_STATUS_STYLES[status]}`}>
      {RAIL_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * @param {{ rail: import('@/config/capitalStack').CapitalRail, tone: typeof RAIL_TONES[string], compact?: boolean }} props
 */
function Rail({ rail, tone, compact = false }) {
  return (
    <Card
      className={`relative border-t-4 ${tone.border} bg-surface shadow-card hover:shadow-card-hover transition-shadow ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-xs font-bold uppercase tracking-wider ${tone.label}`}>{rail.eyebrow}</span>
        <span className={`px-2 py-0.5 text-[10px] font-semibold ${tone.pill} rounded-full`}>{rail.tag}</span>
        <RailStatusPill status={rail.status} />
      </div>
      <h3 className={`${compact ? "text-base" : "text-lg"} font-bold text-primary mb-2`}>{rail.title}</h3>
      <p className={`${compact ? "text-xs" : "text-sm"} text-secondary mb-4`}>{rail.description}</p>
      {!compact && (
        <>
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
        </>
      )}
    </Card>
  );
}

/**
 * @param {{ variant?: 'default' | 'compact', showHeader?: boolean, className?: string }} props
 */
export default function CapitalStack({ variant = "default", showHeader = true, className = "" }) {
  const compact = variant === "compact";

  return (
    <div
      id={compact ? undefined : CAPITAL_STACK_ANCHOR_ID}
      className={`${
        compact ? "py-6 bg-transparent" : "py-12 sm:py-16 bg-surface border-t border-default"
      } ${className}`}
    >
      <div className={`${compact ? "max-w-xl mx-auto px-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}`}>
        {showHeader && (
          <div className={`text-center ${compact ? "mb-6" : "mb-10"}`}>
            <h2 className={`${compact ? "text-lg" : "text-2xl sm:text-3xl"} font-bold text-primary mb-3`}>
              {CAPITAL_STACK_HEADING}
            </h2>
            <p className={`${compact ? "text-xs" : "text-sm sm:text-base"} text-secondary max-w-2xl mx-auto`}>
              {CAPITAL_STACK_SUBHEADING}
            </p>
          </div>
        )}

        <div className={`flex ${compact ? "flex-col gap-3" : "flex-col md:flex-row items-stretch gap-4 sm:gap-6"}`}>
          {CAPITAL_RAILS.map((rail, index) => (
            <React.Fragment key={rail.id}>
              {index > 0 && !compact && <Arrow />}
              <Rail rail={rail} tone={RAIL_TONES[rail.tone]} compact={compact} />
            </React.Fragment>
          ))}
        </div>

        {!compact && (
          <p className="text-center text-xs sm:text-sm text-tertiary mt-8">{CAPITAL_STACK_FOOTNOTE}</p>
        )}
      </div>
    </div>
  );
}
