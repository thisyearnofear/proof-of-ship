/**
 * Referral landing page — captures the referral code from the URL,
 * stores it in localStorage (first-touch wins), then redirects to signup.
 */

import { useEffect } from "react";
import { useRouter } from "next/router";
import { storeReferralCode } from "@/lib/gamification/referral";

export default function ReferralPage() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code) {
      storeReferralCode(String(code));
    }
    // Redirect to signup after capturing the code
    const timer = setTimeout(() => {
      router.replace("/login?mode=signup");
    }, 500);
    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🚢</span>
        </div>
        <h1 className="text-xl font-bold text-primary mb-2">Welcome aboard!</h1>
        <p className="text-sm text-secondary">Redirecting you to sign up...</p>
      </div>
    </div>
  );
}
