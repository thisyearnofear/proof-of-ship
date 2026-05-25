/**
 * Next.js Edge Middleware — Subdomain Routing + Security Headers
 *
 * This is the ONLY middleware file for the app. It runs at the edge
 * (Vercel/Next.js) and rewrites subdomain root paths to user profiles.
 *
 * Example: alice.proofofship.web.app/ → /u/alice
 *
 * Note: src/middleware/errorHandler.js is NOT edge middleware — it's a
 * server-side error handler used by API routes. Different purpose.
 */

import { NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin"]);
const SUBDOMAIN_ALIASES = {
  papa: "thisyearnofear",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const PLATFORM_DOMAINS = new Set([
  "vercel.app",
  "web.app",
  "firebaseapp.com",
  "netlify.app",
]);

function getSubdomain(hostname) {
  if (!hostname) return null;

  const host = hostname.split(":")[0];
  const parts = host.split(".").filter(Boolean);

  if (parts.length < 2) return null;

  if (parts[parts.length - 1] === "localhost" && parts.length === 2) {
    return parts[0];
  }

  // Don't treat platform deployment URLs as subdomains
  const baseDomain = parts.slice(-2).join(".");
  if (PLATFORM_DOMAINS.has(baseDomain)) {
    return null;
  }

  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

function applySecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

export function middleware(req) {
  const hostname = req.headers.get("host");
  let subdomain = getSubdomain(hostname);
  if (subdomain && SUBDOMAIN_ALIASES[subdomain]) {
    subdomain = SUBDOMAIN_ALIASES[subdomain];
  }

  let response;

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    response = NextResponse.next();
  } else {
    const url = req.nextUrl.clone();

    if (url.pathname === "/") {
      url.pathname = `/u/${subdomain}`;
      response = NextResponse.rewrite(url);
    } else {
      response = NextResponse.next();
    }
  }

  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
