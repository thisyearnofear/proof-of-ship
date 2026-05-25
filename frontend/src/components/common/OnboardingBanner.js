/**
 * Onboarding Banner — first-run experience for all visitors
 *
 * Dual-mode:
 *   - Unauthenticated visitors: platform value prop + sign-up/explore CTAs
 *   - Authenticated users: role-based (builder/backer) step-by-step guide
 *
 * Both modes are dismissible via separate localStorage keys.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { trackEvent } from "@/lib/analytics";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AUTH_STORAGE_KEY = "pos_onboarding_dismissed";
const GUEST_STORAGE_KEY = "pos_guest_banner_dismissed";

export default function OnboardingBanner() {
  const router = useRouter();
  const { currentUser, userRole, onboardingComplete, loading } = useUser();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ── Detect prefers-reduced-motion once on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Auth state resolved? Skip during initial loading to avoid flash ──
  const resolved = !loading;

  useEffect(() => {
    if (!resolved) return;

    // Skip guest banner on auth pages — the user is already in the sign-up flow
    const authPaths = ["/login", "/signup"];

    if (!currentUser) {
      // Unauthenticated visitor — show guest banner unless dismissed
      if (authPaths.includes(router.pathname)) return;
      const dismissed = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } else if (onboardingComplete) {
      // Authenticated user with completed onboarding — show role steps
      const dismissed = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } else {
      // Authenticated but onboarding not complete — don't show this banner
      // (the page-level onboarding flow handles this)
      setVisible(false);
    }
  }, [resolved, currentUser, onboardingComplete, router.pathname]);

  // Small delay to mount before showing transition
  useEffect(() => {
    if (visible) {
      if (prefersReducedMotion) {
        setMounted(true);
      } else {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
      }
    } else {
      setMounted(false);
    }
  }, [visible, prefersReducedMotion]);

  if (!resolved || !visible) return null;

  const transitionClass = prefersReducedMotion
    ? ""
    : "transition-all duration-500 ease-out";
  const containerClass = mounted
    ? `opacity-100 translate-y-0 ${transitionClass}`
    : `opacity-0 -translate-y-2 ${transitionClass}`;

  // ── Guest banner — shown to unauthenticated visitors ──
  if (!currentUser) {
    return (
      <div className={containerClass}>
        <GuestBanner
          onDismiss={() => {
            setVisible(false);
            localStorage.setItem(GUEST_STORAGE_KEY, "1");
            trackEvent("onboarding_banner_dismissed", { mode: "guest" });
          }}
          router={router}
        />
      </div>
    );
  }

  // ── Authenticated banner — role-based steps ──
  return (
    <div className={containerClass}>
      <AuthBanner
        userRole={userRole}
        onDismiss={() => {
          setVisible(false);
          localStorage.setItem(AUTH_STORAGE_KEY, "1");
          trackEvent("onboarding_banner_dismissed", { mode: "auth", role: userRole });
        }}
        router={router}
      />
    </div>
  );
}

/* ===================================================================
 * Guest Banner — platform value prop for unauthenticated visitors
 * =================================================================== */
function GuestBanner({ onDismiss, router }) {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Proof-Backed Reputation",
      desc: "Connect GitHub to verify your shipping history. Every claim backed by evidence builds trust.",
    },
    {
      icon: BanknotesIcon,
      title: "Get Backed with USDC",
      desc: "Backers stake on your projects. Win hackathon prizes and your backers are repaid automatically.",
    },
    {
      icon: UserGroupIcon,
      title: "Community Testing",
      desc: "Open your project for tester feedback. Increase your proof score and attract more backers.",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-2xl">🚢</span>
              <span className="text-lg font-bold text-white">Proof of Ship</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/20 text-white/90 rounded-full">
                Turn your code into credit
              </span>
            </div>

            <p className="text-sm text-indigo-100 max-w-2xl mb-4">
              Submit your open-source projects, attach proof from hackathons you&apos;ve won,
              and let backers stake USDC on your success. No more asking &mdash; just ship.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <f.icon className="w-5 h-5 text-indigo-200 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">{f.title}</p>
                    <p className="text-[11px] text-indigo-200 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/login?mode=signup")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20"
              >
                <RocketLaunchIcon className="w-4 h-4" />
                Start Shipping — Sign Up
              </button>
              <button
                onClick={() => router.push("/explore")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Explore Projects
              </button>
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-indigo-200 rounded-lg text-sm font-medium hover:text-white transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg flex-shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
 * Auth Banner — role-based step-by-step for authenticated users
 * =================================================================== */
function AuthBanner({ userRole, onDismiss, router }) {
  const builderSteps = [
    {
      icon: MagnifyingGlassIcon,
      title: "1. Explore Projects",
      desc: "Browse builder portfolios across 7 ecosystems",
      action: () => router.push("/explore"),
      cta: "Explore \u2192",
    },
    {
      icon: SparklesIcon,
      title: "2. Try AI Agents",
      desc: "Get instant project analysis for fractions of a cent",
      action: () => router.push("/back?tab=economy"),
      cta: "Try Agents \u2192",
    },
    {
      icon: RocketLaunchIcon,
      title: "3. Submit a Project",
      desc: "Showcase your work and get backed by the community",
      action: () => router.push("/projects/new"),
      cta: "Submit \u2192",
    },
  ];

  const backerSteps = [
    {
      icon: MagnifyingGlassIcon,
      title: "1. Explore Builders",
      desc: "Find promising projects and builders to back",
      action: () => router.push("/explore"),
      cta: "Explore \u2192",
    },
    {
      icon: SparklesIcon,
      title: "2. Analyze with AI",
      desc: "Use AI agents to evaluate project health and risk",
      action: () => router.push("/back?tab=economy"),
      cta: "Analyze \u2192",
    },
    {
      icon: BanknotesIcon,
      title: "3. Stake Privately",
      desc: "Your positions are shielded by default — no copy-staking",
      action: () => router.push("/back?tab=discover"),
      cta: "Stake \u2192",
    },
  ];

  const steps = userRole === "backer" ? backerSteps : builderSteps;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-purple-50 dark:from-blue-900/20 dark:via-teal-900/20 dark:to-purple-900/20 border-b border-blue-100 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {userRole === "backer"
                ? "\uD83D\uDC4B Welcome back — here's how to start backing builders:"
                : "\uD83D\uDC4B Welcome back — here's how to get started:"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {steps.map((step) => (
                <button
                  key={step.title}
                  onClick={step.action}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors text-left"
                >
                  <step.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
                      {step.cta}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
