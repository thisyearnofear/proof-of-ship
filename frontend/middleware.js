import { NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin"]);
const SUBDOMAIN_ALIASES = {
  papa: "thisyearnofear",
};

function getSubdomain(hostname) {
  if (!hostname) return null;

  const host = hostname.split(":")[0];
  const parts = host.split(".").filter(Boolean);

  if (parts.length < 2) return null;

  // localhost (username.localhost)
  if (parts[parts.length - 1] === "localhost" && parts.length === 2) {
    return parts[0];
  }

  // user.domain.tld -> first label
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export function middleware(req) {
  const hostname = req.headers.get("host");
  let subdomain = getSubdomain(hostname);
  if (subdomain && SUBDOMAIN_ALIASES[subdomain]) {
    subdomain = SUBDOMAIN_ALIASES[subdomain];
  }

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();

  // Keep app routes working on subdomains; only rewrite the root to the user portfolio.
  if (url.pathname === "/") {
    url.pathname = `/u/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
