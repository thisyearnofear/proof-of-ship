import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/solid";

/**
 * Breadcrumbs — auto-generates from URL path, or accepts custom items prop.
 * @param {{ items?: Array<{label: string, href?: string}> }} props
 */
const Breadcrumbs = ({ items }) => {
  const router = useRouter();

  const crumbs = items
    ? items
    : router.asPath
        .split("?")[0]
        .split("/")
        .filter(Boolean)
        .map((seg, i, arr) => ({
          label: decodeURIComponent(seg).charAt(0).toUpperCase() + decodeURIComponent(seg).slice(1).replace(/-/g, " "),
          href: "/" + arr.slice(0, i + 1).join("/"),
        }));

  if (!crumbs.length) return null;

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1 text-sm flex-wrap">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              {!isLast && crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
