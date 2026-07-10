import React from "react";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Shared page chrome — breadcrumbs, title, subtitle, optional tab detail.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   detail?: string,
 *   breadcrumbs?: Array<{ label: string, href?: string }>,
 *   icon?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   align?: 'left' | 'center',
 *   className?: string,
 * }} props
 */
export default function PageHeader({
  title,
  subtitle,
  detail,
  breadcrumbs,
  icon,
  actions,
  align = "left",
  className = "",
}) {
  const centered = align === "center";

  return (
    <header className={`mb-6 ${centered ? "text-center" : ""} ${className}`.trim()}>
      {breadcrumbs?.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className={`flex items-start gap-4 ${centered ? "flex-col items-center" : "justify-between"}`}>
        <div className={`min-w-0 ${centered ? "w-full" : ""}`}>
          <div className={`flex items-center gap-3 mb-2 ${centered ? "justify-center flex-col" : ""}`}>
            {icon ? <span className="flex-shrink-0">{icon}</span> : null}
            <h1 className={`text-3xl font-bold text-text-primary ${centered ? "text-2xl" : ""}`}>{title}</h1>
          </div>
          {subtitle ? <p className="text-text-secondary">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>

      {detail ? (
        <p className={`text-sm text-text-tertiary mt-2 ${centered ? "" : "ml-1"}`}>{detail}</p>
      ) : null}
    </header>
  );
}
