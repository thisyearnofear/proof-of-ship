import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

const Breadcrumbs = () => {
  const router = useRouter();
  const pathSegments = router.asPath.split("/").filter((segment) => segment);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    const name =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    return { href, name, isLast };
  });

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Home
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb) => (
          <li key={breadcrumb.href}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <Link
                href={breadcrumb.href}
                className={`ml-1 text-sm font-medium ${
                  breadcrumb.isLast
                    ? "text-gray-500"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-current={breadcrumb.isLast ? "page" : undefined}
              >
                {breadcrumb.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
